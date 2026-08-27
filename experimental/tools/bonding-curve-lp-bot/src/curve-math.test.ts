import { describe, it, expect } from 'vitest';
import { asymptoticRatioBps, buyCost, maxTokensForDeposit, prefixCost, reserveRatioBps, sellReturn, spotPrice } from './curve-math';

describe('prefixCost', () => {
  it('matches a naive loop sum for k=1, 2, and 3', () => {
    for (const k of [1, 2, 3]) {
      for (let x = 0n; x <= 50n; x++) {
        let naive = 0n;
        for (let s = 1n; s <= x; s++) {
          naive += s ** BigInt(k);
        }
        expect(prefixCost(1n, k, x)).toBe(naive);
      }
    }
  });

  it('returns null for an unsupported exponent', () => {
    expect(prefixCost(1n, 4, 10n)).toBeNull();
    expect(prefixCost(1n, 0, 10n)).toBeNull();
  });

  it('returns null on overflow', () => {
    const U128_MAX = (1n << 128n) - 1n;
    expect(prefixCost(U128_MAX, 2, U128_MAX)).toBeNull();
  });
});

describe('buyCost and sellReturn', () => {
  it('are exact mirrors of each other over the same range', () => {
    for (const k of [1, 2, 3]) {
      const cost = buyCost(3n, k, 10n, 5n);
      expect(cost).not.toBeNull();
      expect(sellReturn(3n, k, 15n, 5n)).toBe(cost);
    }
  });

  it('sellReturn returns null when amount exceeds supply', () => {
    expect(sellReturn(1n, 1, 4n, 5n)).toBeNull();
  });

  it('buyCost matches the contract test fixture: m=2, k=1, 5 tokens from supply 0 costs 30', () => {
    // price(s) = 2*s for s=1..5 => 2+4+6+8+10 = 30
    expect(buyCost(2n, 1, 0n, 5n)).toBe(30n);
  });
});

describe('spotPrice', () => {
  it('is slope for the first token at k=1 (m * 1^1)', () => {
    expect(spotPrice(2n, 1, 0n)).toBe(2n);
  });

  it('matches the contract fixture: spot price at supply 0, k=3 is slope * 1^3', () => {
    expect(spotPrice(2n, 3, 0n)).toBe(2n);
  });

  it('increases monotonically with supply', () => {
    const p1 = spotPrice(2n, 2, 10n)!;
    const p2 = spotPrice(2n, 2, 20n)!;
    expect(p2).toBeGreaterThan(p1);
  });
});

describe('maxTokensForDeposit', () => {
  it('matches the contract test fixture: m=2, k=1, supply=0, deposit=12 buys exactly 3', () => {
    expect(maxTokensForDeposit(2n, 1, 0n, 12n)).toBe(3n);
  });

  it('matches the contract test fixture: deposit=11 buys only 2', () => {
    expect(maxTokensForDeposit(2n, 1, 0n, 11n)).toBe(2n);
  });

  it('returns 0 when the deposit cannot afford even the first token', () => {
    expect(maxTokensForDeposit(2n, 1, 0n, 1n)).toBe(0n);
    expect(maxTokensForDeposit(2n, 1, 0n, 0n)).toBe(0n);
  });

  it('a buy followed by a sell of the same amount returns exactly what was paid', () => {
    const tokens = maxTokensForDeposit(2n, 2, 0n, 1000n);
    const cost = buyCost(2n, 2, 0n, tokens)!;
    const refund = sellReturn(2n, 2, tokens, tokens)!;
    expect(refund).toBe(cost);
  });
});

describe('reserveRatioBps', () => {
  it('is 0 when supply is 0', () => {
    expect(reserveRatioBps(0n, 100n, 0n)).toBe(0n);
  });

  it('approaches the asymptotic ratio for k=1 as supply grows large', () => {
    const supply = 1000n;
    const cost = buyCost(2n, 1, 0n, supply)!;
    const spot = spotPrice(2n, 1, supply)!;
    const ratio = reserveRatioBps(cost, spot, supply)!;
    // Contract's own test asserts this lands in (4900, 5000] for k=1.
    expect(Number(ratio)).toBeGreaterThan(4900);
    expect(Number(ratio)).toBeLessThanOrEqual(5000);
  });
});

describe('asymptoticRatioBps', () => {
  it('is 5000 for k=1, 3333 for k=2 (rounded down), and 2500 for k=3', () => {
    expect(asymptoticRatioBps(1)).toBe(5000);
    expect(asymptoticRatioBps(2)).toBe(3333);
    expect(asymptoticRatioBps(3)).toBe(2500);
  });
});
