import { buyCost, maxTokensForDeposit, reserveRatioBps, sellReturn, spotPrice } from './curve-math';
import { SeededRandom, decideTrade } from './strategy';
import {
  SlippageExceededError,
  type BotConfig,
  type PoolState,
  type RunSummary,
  type TradeDecision,
  type TradeExecutor,
  type TradeResult,
} from './types';

/**
 * In-memory executor that prices trades using the exact same integer
 * curve math as the real `DynamicBondingCurve` Soroban contract (see
 * `curve-math.ts`, ported from
 * `experimental/contracts/dynamic-bonding-curve/src/math.rs`): a buy of
 * `sizeXlm` deposit units mints `maxTokensForDeposit` tokens at the
 * current supply, and a sell converts the requested notional into an
 * equivalent token amount at the current spot price before applying
 * `sellReturn`. This is the default executor so the bot is fully runnable
 * and testable without a funded wallet or a live RPC connection — see
 * README Known Limitations for what a real `TradeExecutor` (submitting
 * actual `buy_tokens`/`sell_tokens` invocations via
 * `@stellar/stellar-sdk`) would need to do instead.
 */
export class SimulatedExecutor implements TradeExecutor {
  private supply: bigint;
  private reserve: bigint;
  private readonly slope: bigint;
  private readonly exponent: number;
  private walletXlm: number;
  private walletTokens = 0n;
  private readonly rng: SeededRandom;
  private txCounter = 0;

  constructor(initialPool: { slope: bigint; exponent: number; supply?: bigint; reserve?: bigint }, initialWalletXlm: number, seed: number) {
    this.slope = initialPool.slope;
    this.exponent = initialPool.exponent;
    this.supply = initialPool.supply ?? 0n;
    this.reserve = initialPool.reserve ?? 0n;
    this.walletXlm = initialWalletXlm;
    this.rng = new SeededRandom(seed ^ 0x9e3779b9);
  }

  private snapshot(): PoolState {
    const spot = spotPrice(this.slope, this.exponent, this.supply) ?? 0n;
    const ratioBps = reserveRatioBps(this.reserve, spot, this.supply) ?? 0n;
    return {
      supply: this.supply,
      reserve: this.reserve,
      spotPrice: spot,
      reserveRatioBps: ratioBps,
      slope: this.slope,
      exponent: this.exponent,
    };
  }

  async getPoolState(): Promise<PoolState> {
    return this.snapshot();
  }

  async getWalletBalanceXlm(): Promise<number> {
    return this.walletXlm;
  }

  async executeTrade(decision: TradeDecision, maxSlippage: number): Promise<TradeResult> {
    if (decision.side === 'buy') {
      return this.executeBuy(decision, maxSlippage);
    }
    return this.executeSell(decision, maxSlippage);
  }

  private executeBuy(decision: TradeDecision, maxSlippage: number): TradeResult {
    // Depositing sizeXlm at the *current* spot price would quote this many
    // tokens if price never moved; comparing that to what the curve's
    // convex pricing actually mints for the same deposit is this trade's
    // realized slippage (mirrors how `min_tokens_out` protects a caller
    // against the price having moved since they quoted).
    const spotNow = spotPrice(this.slope, this.exponent, this.supply) ?? 1n;
    const depositUnits = BigInt(Math.max(1, Math.round(decision.sizeXlm)));
    const effectiveSpot = spotNow === 0n ? 1n : spotNow;

    const tokensOut = maxTokensForDeposit(this.slope, this.exponent, this.supply, depositUnits);
    // Compare in a common unit (deposit space: tokensOut * price vs. depositUnits)
    // instead of pre-dividing depositUnits / spotNow, which truncates to an
    // integer quotient and can mask real price impact once spotNow grows large
    // relative to the deposit (e.g. 5000/2000 = 2, discarding the same rounding
    // error that maxTokensForDeposit's convex pricing would otherwise reveal).
    const naiveQuote = depositUnits / effectiveSpot;
    const slippage =
      depositUnits === 0n ? 0 : Math.abs(Number(depositUnits - tokensOut * effectiveSpot)) / Number(depositUnits);

    if (tokensOut === 0n) {
      throw new SlippageExceededError('deposit too small to mint any tokens at the current curve position');
    }
    if (slippage > maxSlippage) {
      throw new SlippageExceededError(
        `buy would realize ${(slippage * 100).toFixed(2)}% slippage, exceeding the ${(maxSlippage * 100).toFixed(2)}% guard`
      );
    }

    const cost = buyCost(this.slope, this.exponent, this.supply, tokensOut) ?? depositUnits;

    this.supply += tokensOut;
    this.reserve += cost;
    this.walletXlm -= Number(cost);
    this.walletTokens += tokensOut;

    return this.buildResult(decision, tokensOut, slippage);
  }

  private executeSell(decision: TradeDecision, maxSlippage: number): TradeResult {
    const spotNow = spotPrice(this.slope, this.exponent, this.supply) ?? 1n;
    const requestedTokens = BigInt(Math.max(1, Math.round(decision.sizeXlm / Math.max(1, Number(spotNow)))));
    const tokensToSell = requestedTokens > this.walletTokens ? this.walletTokens : requestedTokens;

    if (tokensToSell === 0n) {
      throw new SlippageExceededError('no token balance available to sell');
    }

    const naiveQuote = tokensToSell * spotNow;
    const payout = sellReturn(this.slope, this.exponent, this.supply, tokensToSell);
    if (payout === null) {
      throw new SlippageExceededError('sell amount exceeds current supply');
    }

    const slippage = naiveQuote === 0n ? 0 : Math.abs(Number(naiveQuote - payout)) / Number(naiveQuote);
    if (slippage > maxSlippage) {
      throw new SlippageExceededError(
        `sell would realize ${(slippage * 100).toFixed(2)}% slippage, exceeding the ${(maxSlippage * 100).toFixed(2)}% guard`
      );
    }

    this.supply -= tokensToSell;
    this.reserve -= payout;
    this.walletXlm += Number(payout);
    this.walletTokens -= tokensToSell;

    return this.buildResult(decision, payout, slippage);
  }

  private buildResult(decision: TradeDecision, amount: bigint, slippage: number): TradeResult {
    this.txCounter += 1;
    const gasStroops = 100 + Math.floor(this.rng.next() * 400); // typical Soroban base-fee range

    return {
      decision,
      txHash: `SIM_${this.txCounter.toString().padStart(6, '0')}_${this.rng.next().toString(36).slice(2, 10)}`,
      gasStroops,
      amount,
      slippage,
      poolStateAfter: this.snapshot(),
      timestamp: Date.now(),
    };
  }
}

export interface BotRunOptions {
  /** Number of trade cycles to run. Omit/Infinity for continuous operation until stopped. */
  maxCycles?: number;
  /** Called after every executed trade, for CLI logging. */
  onTrade?: (result: TradeResult) => void;
  /** Called after every skipped (not executed) decision, for CLI logging. */
  onSkip?: (decision: TradeDecision, reason: string) => void;
  /** Called once if the bot halts before completing maxCycles. */
  onHalt?: (reason: string, walletBalanceXlm: number) => void;
  /** Sleep function, overridable in tests to avoid real delays. */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Drives the bot's trade loop: on each cycle, reads pool + wallet state,
 * asks the strategy for a decision, enforces the emergency reserve and
 * max-position guardrails, executes the trade (skipping it on a slippage
 * guard trip rather than treating that as fatal), and repeats after
 * `config.tradeIntervalMs`. Returns a summary when the loop ends, whether
 * by exhausting `maxCycles`, a `stop()` call, or a guardrail halt.
 */
export class LiquidityBot {
  private readonly config: BotConfig;
  private readonly executor: TradeExecutor;
  private readonly rng: SeededRandom;
  private stopped = false;
  private openPositionXlm = 0;

  constructor(config: BotConfig, executor: TradeExecutor) {
    this.config = config;
    this.executor = executor;
    this.rng = new SeededRandom(config.seed);
  }

  /** Requests the run loop stop after the current cycle (used by SIGINT/SIGTERM handlers). */
  stop(): void {
    this.stopped = true;
  }

  async run(options: BotRunOptions = {}): Promise<RunSummary> {
    const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
    const maxCycles = options.maxCycles ?? Infinity;

    const summary: RunSummary = {
      tradesExecuted: 0,
      tradesSkipped: 0,
      buys: 0,
      sells: 0,
      totalVolumeXlm: 0,
      totalGasStroops: 0,
      averageSlippage: 0,
      haltedReason: null,
      startedAt: Date.now(),
      endedAt: Date.now(),
    };

    let slippageSum = 0;
    let cycle = 0;

    while (!this.stopped && cycle < maxCycles) {
      cycle += 1;

      const walletBalanceXlm = await this.executor.getWalletBalanceXlm();
      if (walletBalanceXlm < this.config.emergencyReserveXlm) {
        summary.haltedReason = `wallet balance (${walletBalanceXlm.toFixed(2)} XLM) fell below the emergency reserve (${this.config.emergencyReserveXlm} XLM)`;
        options.onHalt?.(summary.haltedReason, walletBalanceXlm);
        break;
      }

      const pool = await this.executor.getPoolState();
      const decision = decideTrade(pool, this.config, this.rng);

      const hypotheticalPosition =
        decision.side === 'buy' ? this.openPositionXlm + decision.sizeXlm : this.openPositionXlm - decision.sizeXlm;

      if (decision.side === 'buy' && Math.abs(hypotheticalPosition) > this.config.maxPositionXlm) {
        // Skip this cycle's trade rather than halting entirely — a single
        // capped-out cycle isn't an emergency, just a no-op tick.
        summary.tradesSkipped += 1;
        options.onSkip?.(decision, `would exceed max position (${this.config.maxPositionXlm} XLM)`);
        await sleep(this.config.tradeIntervalMs);
        continue;
      }

      let result: TradeResult;
      try {
        result = await this.executor.executeTrade(decision, this.config.maxSlippage);
      } catch (err) {
        if (err instanceof SlippageExceededError) {
          summary.tradesSkipped += 1;
          options.onSkip?.(decision, err.message);
          await sleep(this.config.tradeIntervalMs);
          continue;
        }
        throw err;
      }

      this.openPositionXlm = hypotheticalPosition;

      summary.tradesExecuted += 1;
      summary[decision.side === 'buy' ? 'buys' : 'sells'] += 1;
      summary.totalVolumeXlm += decision.sizeXlm;
      summary.totalGasStroops += result.gasStroops;
      slippageSum += result.slippage;

      options.onTrade?.(result);

      if (cycle < maxCycles && !this.stopped) {
        await sleep(this.config.tradeIntervalMs);
      }
    }

    summary.averageSlippage = summary.tradesExecuted > 0 ? slippageSum / summary.tradesExecuted : 0;
    summary.endedAt = Date.now();
    return summary;
  }
}
