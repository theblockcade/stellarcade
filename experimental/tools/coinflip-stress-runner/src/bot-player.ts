import type { BetStrategy, PlayerStats, RoundResult, StressTestConfig } from './types';

// ─── Deterministic PRNG (mulberry32) ────────────────────────────────────────

export function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Betting Strategies ──────────────────────────────────────────────────────

export interface BettingStrategy {
  /** Returns the bet amount for this round. */
  nextBet(): number;
  /** Notify the strategy of the outcome. */
  recordOutcome(won: boolean): void;
  /** Reset the strategy state (new session). */
  reset(): void;
}

export class FlatBetStrategy implements BettingStrategy {
  constructor(private readonly baseBet: number) {}

  nextBet(): number {
    return this.baseBet;
  }

  recordOutcome(_won: boolean): void {
    // No-op: flat bet never changes.
  }

  reset(): void {
    // No-op.
  }
}

export class MartingaleStrategy implements BettingStrategy {
  private currentMultiplier = 1;

  constructor(private readonly baseBet: number) {}

  nextBet(): number {
    return this.baseBet * this.currentMultiplier;
  }

  recordOutcome(won: boolean): void {
    if (won) {
      this.currentMultiplier = 1;
    } else {
      this.currentMultiplier *= 2;
    }
  }

  reset(): void {
    this.currentMultiplier = 1;
  }
}

export class FibonacciStrategy implements BettingStrategy {
  private sequence = [1, 1];
  private currentIndex = 0;

  constructor(private readonly baseBet: number) {}

  nextBet(): number {
    return this.baseBet * this.sequence[this.currentIndex]!;
  }

  recordOutcome(won: boolean): void {
    if (won) {
      // Move back two steps, floor at 0.
      this.currentIndex = Math.max(0, this.currentIndex - 2);
    } else {
      // Advance one step; extend the sequence if needed.
      const nextIndex = this.currentIndex + 1;
      if (nextIndex >= this.sequence.length) {
        const len = this.sequence.length;
        this.sequence.push(this.sequence[len - 1]! + this.sequence[len - 2]!);
      }
      this.currentIndex = nextIndex;
    }
  }

  reset(): void {
    this.currentIndex = 0;
    this.sequence = [1, 1];
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createStrategy(strategy: BetStrategy, baseBet: number): BettingStrategy {
  switch (strategy) {
    case 'flat':
      return new FlatBetStrategy(baseBet);
    case 'martingale':
      return new MartingaleStrategy(baseBet);
    case 'fibonacci':
      return new FibonacciStrategy(baseBet);
  }
}

// ─── Gas Cost Simulation ─────────────────────────────────────────────────────

/** Simulates a gas cost in base units. Varies slightly per round for realism. */
function simulateGas(rng: () => number): number {
  // Base gas ~100 units, jitter +/- 20%.
  return Math.round(100 + (rng() - 0.5) * 40);
}

// ─── Bot Player ──────────────────────────────────────────────────────────────

export interface BotPlayerConfig {
  id: string;
  strategy: BetStrategy;
  startingBalance: number;
  baseBet: number;
  rounds: number;
  rng: () => number;
}

export interface BotPlayerResult {
  stats: PlayerStats;
  rounds: RoundResult[];
}

/**
 * Runs a single bot through `rounds` coinflip rounds, tracking balance,
 * wins/losses, streaks, and gas spent. The coinflip is simulated locally
 * (no blockchain calls) using the provided RNG.
 */
export function runBotPlayer(config: BotPlayerConfig): BotPlayerResult {
  const strategy = createStrategy(config.strategy, config.baseBet);
  let balance = config.startingBalance;
  let wins = 0;
  let losses = 0;
  let totalWagered = 0;
  let totalPayout = 0;
  let gasSpent = 0;
  let maxBalance = balance;
  let minBalance = balance;
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  const rounds: RoundResult[] = [];

  for (let i = 1; i <= config.rounds; i++) {
    const bet = strategy.nextBet();
    const gas = simulateGas(config.rng);

    // Simulate coinflip: 50/50 outcome with a built-in house edge of ~2%
    // (bot wins ~49% of the time, house wins ~51%).
    const won = config.rng() < 0.49;

    let payout = 0;
    if (won) {
      payout = bet * 2; // 1:1 payout
      wins += 1;
      currentWinStreak += 1;
      currentLoseStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else {
      losses += 1;
      currentLoseStreak += 1;
      currentWinStreak = 0;
      longestLoseStreak = Math.max(longestLoseStreak, currentLoseStreak);
    }

    totalWagered += bet;
    totalPayout += payout;
    balance = balance - bet + payout - gas;
    gasSpent += gas;
    maxBalance = Math.max(maxBalance, balance);
    minBalance = Math.min(minBalance, balance);

    strategy.recordOutcome(won);

    // Update current streak sign
    if (won) {
      currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
    } else {
      currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
    }

    rounds.push({
      roundNumber: i,
      playerId: config.id,
      bet,
      won,
      payout,
      balanceAfter: balance,
      streak: currentStreak,
    });
  }

  const roundsPlayed = wins + losses;
  const winRate = roundsPlayed > 0 ? wins / roundsPlayed : 0;

  const stats: PlayerStats = {
    id: config.id,
    strategy: config.strategy,
    roundsPlayed,
    wins,
    losses,
    winRate,
    totalWagered,
    totalPayout,
    netProfit: totalPayout - totalWagered - gasSpent,
    gasSpent,
    maxBalance,
    minBalance,
    longestWinStreak,
    longestLoseStreak,
    rounds,
  };

  return { stats, rounds };
}

// ─── Concurrency Runner ──────────────────────────────────────────────────────

/**
 * Runs multiple bots concurrently up to `concurrency` at a time.
 * Returns all player stats once all bots have finished.
 */
export function runBotsConcurrently(
  botConfigs: BotPlayerConfig[],
  concurrency: number,
): PlayerStats[] {
  const results: PlayerStats[] = [];
  let index = 0;

  function runNext(): void {
    while (results.length < botConfigs.length && (results.length - index < concurrency || index >= botConfigs.length)) {
      if (index >= botConfigs.length) break;
      const config = botConfigs[index]!;
      index += 1;
      const result = runBotPlayer(config);
      results.push(result.stats);
    }
  }

  // Synchronous simulation — run bots sequentially in batches to avoid
  // actual async overhead. This is a local stress test, not a real RPC
  // workload, so sequential simulation is fine.
  while (results.length < botConfigs.length) {
    const remaining = concurrency - ((results.length) % concurrency || concurrency);
    const batchEnd = Math.min(index + remaining, botConfigs.length);
    for (; index < batchEnd; index++) {
      const config = botConfigs[index]!;
      const result = runBotPlayer(config);
      results.push(result.stats);
    }
  }

  return results;
}
