import { describe, it, expect } from 'vitest';
import { SeededRandom, computeRatioDeviation, decideTrade } from './strategy';
import { asymptoticRatioBps } from './curve-math';
import type { BotConfig, PoolState } from './types';

function makeConfig(overrides: Partial<BotConfig> = {}): BotConfig {
  return {
    botSecretKey: 'S_TEST',
    contractId: 'C_TEST',
    rpcUrl: 'https://example.invalid',
    tradeIntervalMs: 1000,
    maxPositionXlm: 1000,
    emergencyReserveXlm: 5,
    driftBias: 0.5,
    minTradeXlm: 1,
    maxTradeXlm: 10,
    maxSlippage: 0.05,
    seed: 1,
    ...overrides,
  };
}

function makePool(overrides: Partial<PoolState> = {}): PoolState {
  return {
    supply: 1000n,
    reserve: 500_000n,
    spotPrice: 2000n,
    reserveRatioBps: 5000n,
    slope: 2n,
    exponent: 1,
    ...overrides,
  };
}

describe('SeededRandom', () => {
  it('produces the exact same sequence of values for the same seed', () => {
    const a = new SeededRandom(123);
    const b = new SeededRandom(123);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('nextFloat stays within the [min, max) bounds', () => {
    const rng = new SeededRandom(9);
    for (let i = 0; i < 200; i++) {
      const v = rng.nextFloat(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThan(5);
    }
  });
});

describe('computeRatioDeviation', () => {
  it('returns 0 when the pool sits exactly at the curve equilibrium for its exponent', () => {
    const target = asymptoticRatioBps(1);
    const pool = makePool({ exponent: 1, reserveRatioBps: BigInt(target) });
    expect(computeRatioDeviation(pool)).toBeCloseTo(0);
  });

  it('returns a positive deviation when the ratio sits above the curve equilibrium', () => {
    const target = asymptoticRatioBps(1);
    const pool = makePool({ exponent: 1, reserveRatioBps: BigInt(target + 1000) });
    expect(computeRatioDeviation(pool)).toBeGreaterThan(0);
  });

  it('returns a negative deviation when the ratio sits below the curve equilibrium (the common case for this curve)', () => {
    const target = asymptoticRatioBps(1);
    const pool = makePool({ exponent: 1, reserveRatioBps: BigInt(Math.floor(target / 2)) });
    expect(computeRatioDeviation(pool)).toBeLessThan(0);
  });

  it('uses a different equilibrium baseline depending on the pool exponent', () => {
    const poolK1 = makePool({ exponent: 1, reserveRatioBps: 4000n });
    const poolK2 = makePool({ exponent: 2, reserveRatioBps: 4000n });
    expect(computeRatioDeviation(poolK1)).not.toBeCloseTo(computeRatioDeviation(poolK2));
  });
});

describe('decideTrade', () => {
  it('produces trade sizes within [minTradeXlm, maxTradeXlm]', () => {
    const pool = makePool();
    const config = makeConfig({ minTradeXlm: 2, maxTradeXlm: 8 });
    const rng = new SeededRandom(42);

    for (let i = 0; i < 100; i++) {
      const decision = decideTrade(pool, config, rng);
      expect(decision.sizeXlm).toBeGreaterThanOrEqual(2);
      expect(decision.sizeXlm).toBeLessThan(8);
      expect(['buy', 'sell']).toContain(decision.side);
    }
  });

  it('is reproducible for the same seed and pool state', () => {
    const pool = makePool();
    const config = makeConfig();

    const rngA = new SeededRandom(7);
    const rngB = new SeededRandom(7);
    const decisionsA = Array.from({ length: 10 }, () => decideTrade(pool, config, rngA));
    const decisionsB = Array.from({ length: 10 }, () => decideTrade(pool, config, rngB));

    expect(decisionsA).toEqual(decisionsB);
  });

  it('leans toward sells when driftBias is set well below 0.5', () => {
    const pool = makePool();
    const config = makeConfig({ driftBias: 0.05 });
    const rng = new SeededRandom(1);

    const decisions = Array.from({ length: 200 }, () => decideTrade(pool, config, rng));
    const sells = decisions.filter((d) => d.side === 'sell').length;

    expect(sells).toBeGreaterThan(120);
  });

  it('leans toward buys when driftBias is set well above 0.5', () => {
    const pool = makePool();
    const config = makeConfig({ driftBias: 0.95 });
    const rng = new SeededRandom(1);

    const decisions = Array.from({ length: 200 }, () => decideTrade(pool, config, rng));
    const buys = decisions.filter((d) => d.side === 'buy').length;

    expect(buys).toBeGreaterThan(120);
  });

  it('leans toward buys when the reserve ratio sits well below the curve equilibrium', () => {
    // A young pool with ratio well below the k=1 asymptote (5000 bps) should
    // lean toward buys, since growing supply pushes the ratio back up.
    const pool = makePool({ exponent: 1, reserveRatioBps: 1000n });
    const config = makeConfig({ driftBias: 0.5 });
    const rng = new SeededRandom(3);

    const decisions = Array.from({ length: 200 }, () => decideTrade(pool, config, rng));
    const buys = decisions.filter((d) => d.side === 'buy').length;

    expect(buys).toBeGreaterThan(100);
  });

  it('leans toward sells when the reserve ratio sits well above the curve equilibrium', () => {
    const pool = makePool({ exponent: 1, reserveRatioBps: 9000n });
    const config = makeConfig({ driftBias: 0.5 });
    const rng = new SeededRandom(3);

    const decisions = Array.from({ length: 200 }, () => decideTrade(pool, config, rng));
    const sells = decisions.filter((d) => d.side === 'sell').length;

    expect(sells).toBeGreaterThan(100);
  });
});
