export type BetStrategy = 'flat' | 'martingale' | 'fibonacci';

export interface StressTestConfig {
  rounds: number;
  concurrency: number;
  strategy: BetStrategy;
  rpcUrl: string;
  /** Initial bankroll per bot, in base units. */
  startingBalance: number;
  /** Bet amount per round (base bet for martingale/fibonacci). */
  baseBet: number;
  /** Seed for the deterministic PRNG driving coinflip outcomes. */
  seed?: number;
}

export interface RoundResult {
  roundNumber: number;
  playerId: string;
  bet: number;
  won: boolean;
  payout: number;
  balanceAfter: number;
  streak: number;
}

export interface PlayerStats {
  id: string;
  strategy: BetStrategy;
  roundsPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  totalWagered: number;
  totalPayout: number;
  netProfit: number;
  gasSpent: number;
  maxBalance: number;
  minBalance: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  rounds: RoundResult[];
}

export interface StressTestSummary {
  config: StressTestConfig;
  players: PlayerStats[];
  globalBankrollDelta: number;
  houseEdgeBps: number;
  totalRounds: number;
  totalWagered: number;
  totalPayout: number;
  /** 95% confidence interval half-width for the house edge estimate. */
  confidenceIntervalHalfWidth: number;
  /** Expected payout ratio (1.0 = zero house edge). */
  expectedPayoutRatio: number;
  /** Observed payout ratio. */
  observedPayoutRatio: number;
  issues: string[];
  transcript: string[];
}

export interface BankrollEntry {
  playerId: string;
  roundNumber: number;
  delta: number;
  runningTotal: number;
}
