import { describe, it, expect } from 'vitest';
import { BankrollTracker, formatReport } from './bankroll-tracker';
import type { PlayerStats, StressTestConfig, StressTestSummary } from './types';
import { runBotPlayer, makeRng } from './bot-player';

// ─── BankrollTracker ─────────────────────────────────────────────────────────

describe('BankrollTracker', () => {
  it('starts with a zero global delta', () => {
    const tracker = new BankrollTracker();
    expect(tracker.getGlobalDelta()).toBe(0);
  });

  it('records positive delta for a win', () => {
    const tracker = new BankrollTracker();
    tracker.recordRound('bot_1', 100, true);
    expect(tracker.getGlobalDelta()).toBe(100);
  });

  it('records negative delta for a loss', () => {
    const tracker = new BankrollTracker();
    tracker.recordRound('bot_1', 100, false);
    expect(tracker.getGlobalDelta()).toBe(-100);
  });

  it('accumulates deltas across rounds', () => {
    const tracker = new BankrollTracker();
    tracker.recordRound('bot_1', 100, true);  // +100
    tracker.recordRound('bot_1', 100, false); // -100
    tracker.recordRound('bot_1', 100, true);  // +100
    expect(tracker.getGlobalDelta()).toBe(100);
  });

  it('tracks per-player deltas independently', () => {
    const tracker = new BankrollTracker();
    tracker.recordRound('bot_1', 100, true);  // bot_1: +100
    tracker.recordRound('bot_2', 100, false); // bot_2: -100
    tracker.recordRound('bot_1', 100, false); // bot_1: -100 -> net 0
    tracker.recordRound('bot_2', 100, true);  // bot_2: +100 -> net 0
    expect(tracker.getPlayerDelta('bot_1')).toBe(0);
    expect(tracker.getPlayerDelta('bot_2')).toBe(0);
    expect(tracker.getGlobalDelta()).toBe(0);
  });

  it('returns 0 for unknown player', () => {
    const tracker = new BankrollTracker();
    expect(tracker.getPlayerDelta('nonexistent')).toBe(0);
  });

  it('getPlayerDeltas returns a copy of all deltas', () => {
    const tracker = new BankrollTracker();
    tracker.recordRound('bot_1', 100, true);
    tracker.recordRound('bot_2', 50, false);
    const deltas = tracker.getPlayerDeltas();
    expect(deltas.get('bot_1')).toBe(100);
    expect(deltas.get('bot_2')).toBe(-50);
    // Mutating the returned map should not affect the tracker.
    deltas.set('bot_1', 999);
    expect(tracker.getPlayerDelta('bot_1')).toBe(100);
  });
});

// ─── generateSummary ─────────────────────────────────────────────────────────

describe('BankrollTracker.generateSummary', () => {
  function makeConfig(overrides: Partial<StressTestConfig> = {}): StressTestConfig {
    return {
      rounds: 100,
      concurrency: 2,
      strategy: 'flat',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      startingBalance: 10000,
      baseBet: 100,
      seed: 42,
      ...overrides,
    };
  }

  function makePlayerStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
    return {
      id: 'bot_1',
      strategy: 'flat',
      roundsPlayed: 100,
      wins: 49,
      losses: 51,
      winRate: 0.49,
      totalWagered: 10000,
      totalPayout: 9800,
      netProfit: -300,
      gasSpent: 10000,
      maxBalance: 10200,
      minBalance: 9500,
      longestWinStreak: 5,
      longestLoseStreak: 7,
      rounds: [],
      ...overrides,
    };
  }

  it('computes house edge in basis points', () => {
    const tracker = new BankrollTracker();
    const config = makeConfig();
    const players = [makePlayerStats()];
    const summary = tracker.generateSummary(config, players, []);
    // payout ratio = 9800 / 10000 = 0.98 -> house edge = 200 bps
    expect(summary.houseEdgeBps).toBe(200);
  });

  it('observed payout ratio matches input data', () => {
    const tracker = new BankrollTracker();
    const config = makeConfig();
    const players = [makePlayerStats()];
    const summary = tracker.generateSummary(config, players, []);
    expect(summary.observedPayoutRatio).toBeCloseTo(0.98, 4);
  });

  it('reports issues when no bots were run', () => {
    const tracker = new BankrollTracker();
    const config = makeConfig();
    const summary = tracker.generateSummary(config, [], []);
    expect(summary.issues).toContain('No bots were run — no data to analyze.');
  });

  it('includes transcript lines', () => {
    const tracker = new BankrollTracker();
    const config = makeConfig();
    const players = [makePlayerStats()];
    const summary = tracker.generateSummary(config, players, ['line1', 'line2']);
    expect(summary.transcript).toEqual(['line1', 'line2']);
  });

  it('includes global bankroll delta from tracker', () => {
    const tracker = new BankrollTracker();
    tracker.recordRound('bot_1', 100, true);
    tracker.recordRound('bot_1', 100, false);
    const config = makeConfig();
    const players = [makePlayerStats()];
    const summary = tracker.generateSummary(config, players, []);
    expect(summary.globalBankrollDelta).toBe(0);
  });

  it('has a non-negative confidence interval half-width', () => {
    const tracker = new BankrollTracker();
    const config = makeConfig();
    const players = [makePlayerStats()];
    const summary = tracker.generateSummary(config, players, []);
    expect(summary.confidenceIntervalHalfWidth).toBeGreaterThanOrEqual(0);
  });
});

// ─── formatReport ────────────────────────────────────────────────────────────

describe('formatReport', () => {
  function makeSummary(): StressTestSummary {
    return {
      config: {
        rounds: 100,
        concurrency: 2,
        strategy: 'flat',
        rpcUrl: 'https://soroban-testnet.stellar.org',
        startingBalance: 10000,
        baseBet: 100,
        seed: 42,
      },
      players: [
        {
          id: 'bot_1',
          strategy: 'flat',
          roundsPlayed: 100,
          wins: 49,
          losses: 51,
          winRate: 0.49,
          totalWagered: 10000,
          totalPayout: 9800,
          netProfit: -300,
          gasSpent: 10000,
          maxBalance: 10200,
          minBalance: 9500,
          longestWinStreak: 5,
          longestLoseStreak: 7,
          rounds: [],
        },
      ],
      globalBankrollDelta: -300,
      houseEdgeBps: 200,
      totalRounds: 100,
      totalWagered: 10000,
      totalPayout: 9800,
      confidenceIntervalHalfWidth: 10,
      expectedPayoutRatio: 0.98,
      observedPayoutRatio: 0.98,
      issues: [],
      transcript: ['test transcript'],
    };
  }

  it('returns an array of lines', () => {
    const lines = formatReport(makeSummary());
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes the header', () => {
    const lines = formatReport(makeSummary());
    expect(lines.some((l) => l.includes('COINFLIP STRESS TEST REPORT'))).toBe(true);
  });

  it('includes per-player data', () => {
    const lines = formatReport(makeSummary());
    expect(lines.some((l) => l.includes('bot_1'))).toBe(true);
  });

  it('includes PASSED when no issues', () => {
    const lines = formatReport(makeSummary());
    expect(lines.some((l) => l.includes('PASSED'))).toBe(true);
  });

  it('includes issue markers when issues exist', () => {
    const summary = makeSummary();
    summary.issues.push('Something went wrong');
    const lines = formatReport(summary);
    expect(lines.some((l) => l.includes('[!] Something went wrong'))).toBe(true);
  });
});

// ─── Integration: runBotPlayer + BankrollTracker ─────────────────────────────

describe('integration — runBotPlayer + BankrollTracker', () => {
  it('tracker correctly accumulates data from real bot runs', () => {
    const tracker = new BankrollTracker();
    const config: StressTestConfig = {
      rounds: 200,
      concurrency: 3,
      strategy: 'flat',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      startingBalance: 10000,
      baseBet: 100,
      seed: 42,
    };

    const players: PlayerStats[] = [];
    for (let i = 0; i < config.concurrency; i++) {
      const rng = makeRng(config.seed! + i);
      const result = runBotPlayer({
        id: `bot_${i + 1}`,
        strategy: config.strategy,
        startingBalance: config.startingBalance,
        baseBet: config.baseBet,
        rounds: config.rounds,
        rng,
      });
      for (const round of result.rounds) {
        tracker.recordRound(`bot_${i + 1}`, round.bet, round.won);
      }
      players.push(result.stats);
    }

    const summary = tracker.generateSummary(config, players, ['integration test']);

    expect(summary.totalRounds).toBe(600);
    expect(summary.players).toHaveLength(3);
    expect(summary.globalBankrollDelta).toBe(
      players.reduce((s, p) => s + p.netProfit, 0) +
      players.reduce((s, p) => s + p.gasSpent, 0),
    );
    expect(summary.houseEdgeBps).toBeGreaterThanOrEqual(0);
    expect(summary.issues).toEqual([]);
  });
});
