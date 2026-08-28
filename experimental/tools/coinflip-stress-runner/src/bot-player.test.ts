import { describe, it, expect } from 'vitest';
import {
  FlatBetStrategy,
  MartingaleStrategy,
  FibonacciStrategy,
  createStrategy,
  runBotPlayer,
  makeRng,
} from './bot-player';
import type { BetStrategy } from './types';

// ─── PRNG ────────────────────────────────────────────────────────────────────

describe('makeRng', () => {
  it('produces values in [0, 1)', () => {
    const rng = makeRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    const valuesA = Array.from({ length: 10 }, () => a());
    const valuesB = Array.from({ length: 10 }, () => b());
    expect(valuesA).not.toEqual(valuesB);
  });
});

// ─── FlatBetStrategy ─────────────────────────────────────────────────────────

describe('FlatBetStrategy', () => {
  it('always returns the base bet', () => {
    const strategy = new FlatBetStrategy(100);
    for (let i = 0; i < 50; i++) {
      expect(strategy.nextBet()).toBe(100);
    }
  });

  it('bet does not change after wins or losses', () => {
    const strategy = new FlatBetStrategy(50);
    strategy.recordOutcome(true);
    expect(strategy.nextBet()).toBe(50);
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(50);
  });

  it('reset has no effect', () => {
    const strategy = new FlatBetStrategy(75);
    strategy.recordOutcome(false);
    strategy.recordOutcome(false);
    strategy.reset();
    expect(strategy.nextBet()).toBe(75);
  });
});

// ─── MartingaleStrategy ──────────────────────────────────────────────────────

describe('MartingaleStrategy', () => {
  it('starts at the base bet', () => {
    const strategy = new MartingaleStrategy(100);
    expect(strategy.nextBet()).toBe(100);
  });

  it('doubles after a loss', () => {
    const strategy = new MartingaleStrategy(100);
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(200);
  });

  it('doubles repeatedly on consecutive losses', () => {
    const strategy = new MartingaleStrategy(100);
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(200);
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(400);
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(800);
  });

  it('resets to base bet after a win', () => {
    const strategy = new MartingaleStrategy(100);
    strategy.recordOutcome(false);
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(400);
    strategy.recordOutcome(true);
    expect(strategy.nextBet()).toBe(100);
  });

  it('reset returns to initial state', () => {
    const strategy = new MartingaleStrategy(100);
    strategy.recordOutcome(false);
    strategy.recordOutcome(false);
    strategy.reset();
    expect(strategy.nextBet()).toBe(100);
  });
});

// ─── FibonacciStrategy ───────────────────────────────────────────────────────

describe('FibonacciStrategy', () => {
  it('starts at 1x base bet', () => {
    const strategy = new FibonacciStrategy(100);
    expect(strategy.nextBet()).toBe(100); // 1 * 100
  });

  it('advances through fibonacci sequence on losses', () => {
    const strategy = new FibonacciStrategy(100);
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(100); // fib(1) = 1
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(200); // fib(2) = 2
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(300); // fib(3) = 3
    strategy.recordOutcome(false);
    expect(strategy.nextBet()).toBe(500); // fib(4) = 5
  });

  it('moves back two steps on a win', () => {
    const strategy = new FibonacciStrategy(100);
    // Advance to fib(4) = 5x
    strategy.recordOutcome(false); // fib(1)
    strategy.recordOutcome(false); // fib(2)
    strategy.recordOutcome(false); // fib(3)
    strategy.recordOutcome(false); // fib(4) -> next bet = 500
    expect(strategy.nextBet()).toBe(500);
    // Win: move back 2 -> fib(2) = 2x
    strategy.recordOutcome(true);
    expect(strategy.nextBet()).toBe(200); // 2 * 100
  });

  it('floor at index 0 on early wins', () => {
    const strategy = new FibonacciStrategy(100);
    strategy.recordOutcome(false); // advance to index 1
    strategy.recordOutcome(true);  // win: move back 2 -> floor at 0
    expect(strategy.nextBet()).toBe(100);
  });

  it('reset returns to initial state', () => {
    const strategy = new FibonacciStrategy(100);
    strategy.recordOutcome(false);
    strategy.recordOutcome(false);
    strategy.recordOutcome(false);
    strategy.reset();
    expect(strategy.nextBet()).toBe(100);
  });
});

// ─── createStrategy factory ──────────────────────────────────────────────────

describe('createStrategy', () => {
  it('creates a FlatBetStrategy for "flat"', () => {
    const s = createStrategy('flat', 100);
    expect(s).toBeInstanceOf(FlatBetStrategy);
  });

  it('creates a MartingaleStrategy for "martingale"', () => {
    const s = createStrategy('martingale', 100);
    expect(s).toBeInstanceOf(MartingaleStrategy);
  });

  it('creates a FibonacciStrategy for "fibonacci"', () => {
    const s = createStrategy('fibonacci', 100);
    expect(s).toBeInstanceOf(FibonacciStrategy);
  });
});

// ─── runBotPlayer ────────────────────────────────────────────────────────────

describe('runBotPlayer', () => {
  function makeConfig(overrides: Partial<Parameters<typeof runBotPlayer>[0]> = {}) {
    return {
      id: 'test_bot',
      strategy: 'flat' as BetStrategy,
      startingBalance: 10000,
      baseBet: 100,
      rounds: 100,
      rng: makeRng(42),
      ...overrides,
    };
  }

  it('plays exactly the requested number of rounds', () => {
    const result = runBotPlayer(makeConfig({ rounds: 50 }));
    expect(result.stats.roundsPlayed).toBe(50);
    expect(result.rounds).toHaveLength(50);
  });

  it('wins + losses equals rounds played', () => {
    const result = runBotPlayer(makeConfig({ rounds: 200 }));
    expect(result.stats.wins + result.stats.losses).toBe(result.stats.roundsPlayed);
  });

  it('win rate is between 0 and 1', () => {
    const result = runBotPlayer(makeConfig({ rounds: 500 }));
    expect(result.stats.winRate).toBeGreaterThanOrEqual(0);
    expect(result.stats.winRate).toBeLessThanOrEqual(1);
  });

  it('total wagered is the sum of all bets', () => {
    const result = runBotPlayer(makeConfig({ rounds: 100, strategy: 'flat' }));
    const sumBets = result.rounds.reduce((s, r) => s + r.bet, 0);
    expect(result.stats.totalWagered).toBe(sumBets);
  });

  it('total payout is the sum of all payouts', () => {
    const result = runBotPlayer(makeConfig({ rounds: 100 }));
    const sumPayouts = result.rounds.reduce((s, r) => s + r.payout, 0);
    expect(result.stats.totalPayout).toBe(sumPayouts);
  });

  it('gas spent is positive', () => {
    const result = runBotPlayer(makeConfig({ rounds: 50 }));
    expect(result.stats.gasSpent).toBeGreaterThan(0);
  });

  it('balance after each round is tracked', () => {
    const result = runBotPlayer(makeConfig({ rounds: 10 }));
    for (const round of result.rounds) {
      expect(typeof round.balanceAfter).toBe('number');
    }
  });

  it('streaks are tracked correctly', () => {
    const result = runBotPlayer(makeConfig({ rounds: 500 }));
    expect(result.stats.longestWinStreak).toBeGreaterThanOrEqual(0);
    expect(result.stats.longestLoseStreak).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic for a given seed', () => {
    const a = runBotPlayer(makeConfig({ seed: 42 }));
    const b = runBotPlayer(makeConfig({ seed: 42 }));
    expect(a.stats.wins).toBe(b.stats.wins);
    expect(a.stats.losses).toBe(b.stats.losses);
    expect(a.stats.totalWagered).toBe(b.stats.totalWagered);
  });

  it('runs with different strategies without errors', () => {
    for (const strategy of ['flat', 'martingale', 'fibonacci'] as const) {
      const result = runBotPlayer(makeConfig({ strategy, rounds: 50 }));
      expect(result.stats.roundsPlayed).toBe(50);
    }
  });

  it('rounds contain correct playerId', () => {
    const result = runBotPlayer(makeConfig({ id: 'my_bot', rounds: 5 }));
    for (const round of result.rounds) {
      expect(round.playerId).toBe('my_bot');
    }
  });
});
