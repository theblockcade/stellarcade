import { describe, it, expect, vi } from 'vitest';
import { LiquidityBot, SimulatedExecutor } from './bot';
import type { BotConfig, TradeDecision } from './types';

function makeConfig(overrides: Partial<BotConfig> = {}): BotConfig {
  return {
    botSecretKey: 'S_TEST',
    contractId: 'C_TEST',
    rpcUrl: 'https://example.invalid',
    tradeIntervalMs: 1,
    maxPositionXlm: 10000,
    emergencyReserveXlm: 5,
    driftBias: 0.5,
    minTradeXlm: 1,
    maxTradeXlm: 10,
    maxSlippage: 0.5,
    seed: 1,
    ...overrides,
  };
}

const noSleep = async () => {};

describe('SimulatedExecutor', () => {
  it('mints tokens and consumes wallet XLM on a buy, matching the curve cost exactly', async () => {
    const executor = new SimulatedExecutor({ slope: 2n, exponent: 1 }, 500, 1);
    const before = await executor.getWalletBalanceXlm();

    // m=2, k=1: buying 5 tokens from supply 0 costs exactly 30, but the convex
    // curve's realized slippage vs. a flat-price quote is ~66.7% at this deposit
    // size, so maxSlippage must be permissive here — this test is about the
    // mint/cost bookkeeping, not the slippage guard itself.
    const decision: TradeDecision = { side: 'buy', sizeXlm: 30, reason: 'test' };
    const result = await executor.executeTrade(decision, 1);

    const after = await executor.getWalletBalanceXlm();
    expect(result.amount).toBe(5n);
    expect(before - after).toBe(30);
    expect(result.poolStateAfter.supply).toBe(5n);
    expect(result.poolStateAfter.reserve).toBe(30n);
  });

  it('throws SlippageExceededError when the deposit is too small to mint any tokens', async () => {
    const executor = new SimulatedExecutor({ slope: 1000n, exponent: 3 }, 500, 1);
    const decision: TradeDecision = { side: 'buy', sizeXlm: 1, reason: 'test' };
    await expect(executor.executeTrade(decision, 0.5)).rejects.toThrow(/too small/);
  });

  it('increases wallet XLM and burns tokens on a sell', async () => {
    const executor = new SimulatedExecutor({ slope: 2n, exponent: 1 }, 500, 1);
    await executor.executeTrade({ side: 'buy', sizeXlm: 30, reason: 'buy first' }, 1);
    const beforeSell = await executor.getWalletBalanceXlm();

    const sellDecision: TradeDecision = { side: 'sell', sizeXlm: 12, reason: 'test' };
    const result = await executor.executeTrade(sellDecision, 0.5);

    const afterSell = await executor.getWalletBalanceXlm();
    expect(afterSell).toBeGreaterThan(beforeSell);
    expect(result.poolStateAfter.supply).toBeLessThan(5n);
  });

  it('throws SlippageExceededError when selling with no token balance', async () => {
    const executor = new SimulatedExecutor({ slope: 2n, exponent: 1 }, 500, 1);
    const decision: TradeDecision = { side: 'sell', sizeXlm: 10, reason: 'test' };
    await expect(executor.executeTrade(decision, 0.5)).rejects.toThrow(/no token balance/);
  });

  it('rejects a trade whose realized slippage exceeds the configured guard', async () => {
    // A buy right after a big prior buy on a low-supply curve has a large
    // relative price move — a very tight maxSlippage should reject it.
    const executor = new SimulatedExecutor({ slope: 2n, exponent: 3 }, 1_000_000, 1);
    await executor.executeTrade({ side: 'buy', sizeXlm: 5000, reason: 'first' }, 1);

    await expect(executor.executeTrade({ side: 'buy', sizeXlm: 5000, reason: 'second' }, 0.0001)).rejects.toThrow(
      /slippage/
    );
  });

  it('produces unique, non-empty transaction hashes across multiple trades', async () => {
    const executor = new SimulatedExecutor({ slope: 2n, exponent: 1 }, 100_000, 1);

    const r1 = await executor.executeTrade({ side: 'buy', sizeXlm: 30, reason: 'a' }, 1);
    const r2 = await executor.executeTrade({ side: 'buy', sizeXlm: 30, reason: 'b' }, 1);

    expect(r1.txHash).not.toEqual(r2.txHash);
    expect(r1.txHash.length).toBeGreaterThan(0);
  });

  it('reports a pool snapshot whose reserveRatioBps is 0 at zero supply', async () => {
    const executor = new SimulatedExecutor({ slope: 2n, exponent: 1 }, 500, 1);
    const pool = await executor.getPoolState();
    expect(pool.supply).toBe(0n);
    expect(pool.reserveRatioBps).toBe(0n);
  });
});

describe('LiquidityBot budget guardrails', () => {
  it('halts trading when wallet balance falls below the emergency reserve', async () => {
    const executor = new SimulatedExecutor({ slope: 2n, exponent: 1 }, 32, 1);
    const config = makeConfig({ emergencyReserveXlm: 5, driftBias: 1, minTradeXlm: 12, maxTradeXlm: 12, maxSlippage: 1 });
    const bot = new LiquidityBot(config, executor);

    const onHalt = vi.fn();
    const summary = await bot.run({ maxCycles: 20, sleep: noSleep, onHalt });

    expect(summary.haltedReason).not.toBeNull();
    expect(onHalt).toHaveBeenCalled();
  });

  it('does not halt when wallet balance stays comfortably above the emergency reserve', async () => {
    const executor = new SimulatedExecutor({ slope: 1n, exponent: 1 }, 1_000_000, 1);
    const config = makeConfig({ emergencyReserveXlm: 5, minTradeXlm: 5, maxTradeXlm: 20, maxSlippage: 1 });
    const bot = new LiquidityBot(config, executor);

    const summary = await bot.run({ maxCycles: 10, sleep: noSleep });

    expect(summary.haltedReason).toBeNull();
    expect(summary.tradesExecuted + summary.tradesSkipped).toBe(10);
  });

  it('skips (does not execute) a buy that would push the open position past maxPositionXlm', async () => {
    const executor = new SimulatedExecutor({ slope: 1n, exponent: 1 }, 1_000_000, 1);
    // driftBias=1 forces every decision to 'buy'; a tiny maxPositionXlm
    // means the very first buy already exceeds it, so trades should be
    // skipped rather than the position growing unbounded.
    const config = makeConfig({ driftBias: 1, maxPositionXlm: 2, minTradeXlm: 10, maxTradeXlm: 10, maxSlippage: 1 });
    const bot = new LiquidityBot(config, executor);

    const onSkip = vi.fn();
    const summary = await bot.run({ maxCycles: 5, sleep: noSleep, onSkip });

    expect(summary.tradesExecuted).toBe(0);
    expect(summary.tradesSkipped).toBe(5);
    expect(summary.haltedReason).toBeNull();
    expect(onSkip).toHaveBeenCalled();
  });

  it('skips (rather than halts or throws) a trade that trips the slippage guard', async () => {
    const executor = new SimulatedExecutor({ slope: 2n, exponent: 3 }, 1_000_000, 1);
    const config = makeConfig({ minTradeXlm: 5000, maxTradeXlm: 5000, maxSlippage: 0.0001, driftBias: 1 });
    const bot = new LiquidityBot(config, executor);

    const onSkip = vi.fn();
    const summary = await bot.run({ maxCycles: 3, sleep: noSleep, onSkip });

    expect(summary.haltedReason).toBeNull();
    expect(summary.tradesSkipped).toBeGreaterThan(0);
  });

  it('stops the run loop after the current cycle when stop() is called', async () => {
    const executor = new SimulatedExecutor({ slope: 1n, exponent: 1 }, 1_000_000, 1);
    const config = makeConfig({ minTradeXlm: 5, maxTradeXlm: 20, maxSlippage: 1 });
    const bot = new LiquidityBot(config, executor);

    let cycles = 0;
    const summary = await bot.run({
      maxCycles: Infinity,
      sleep: async () => {
        cycles += 1;
        if (cycles >= 3) bot.stop();
      },
    });

    expect(summary.tradesExecuted + summary.tradesSkipped).toBeGreaterThan(0);
    expect(summary.tradesExecuted + summary.tradesSkipped).toBeLessThan(1000); // loop actually terminated
  });
});

describe('LiquidityBot run summary', () => {
  it('aggregates volume, gas, and average slippage across trades', async () => {
    const executor = new SimulatedExecutor({ slope: 1n, exponent: 1 }, 1_000_000, 5);
    const config = makeConfig({ minTradeXlm: 30, maxTradeXlm: 30, maxSlippage: 1 });
    const bot = new LiquidityBot(config, executor);

    const summary = await bot.run({ maxCycles: 4, sleep: noSleep });

    expect(summary.tradesExecuted + summary.tradesSkipped).toBe(4);
    expect(summary.buys + summary.sells).toBe(summary.tradesExecuted);
    expect(summary.totalGasStroops).toBeGreaterThanOrEqual(0);
    expect(summary.averageSlippage).toBeGreaterThanOrEqual(0);
    expect(summary.endedAt).toBeGreaterThanOrEqual(summary.startedAt);
  });

  it('invokes onTrade once per executed trade with the trade result', async () => {
    const executor = new SimulatedExecutor({ slope: 1n, exponent: 1 }, 1_000_000, 1);
    const config = makeConfig({ minTradeXlm: 5, maxTradeXlm: 20, maxSlippage: 1 });
    const bot = new LiquidityBot(config, executor);

    const onTrade = vi.fn();
    const summary = await bot.run({ maxCycles: 3, sleep: noSleep, onTrade });

    expect(onTrade).toHaveBeenCalledTimes(summary.tradesExecuted);
  });
});
