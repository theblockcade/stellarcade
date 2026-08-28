export interface TournamentConfig {
  size: number;
  wager: number;
  /** Basis points of the total prize pool retained as protocol fee. */
  feeBps: number;
  /** Seed for the deterministic PRNG driving match outcomes (reproducible runs). */
  seed?: number;
}

export interface MockPlayer {
  id: string;
  address: string;
}

export type MatchOutcome = {
  matchId: string;
  round: number;
  player1: MockPlayer;
  player2: MockPlayer;
  winner: MockPlayer;
  player1Score: number;
  player2Score: number;
  txHash: string;
};

export interface RoundResult {
  round: number;
  matches: MatchOutcome[];
}

export interface PrizeDisbursement {
  player: MockPlayer;
  placement: 'champion' | 'runner-up';
  amount: number;
  txHash: string;
}

export interface TournamentSummary {
  config: TournamentConfig;
  players: MockPlayer[];
  rounds: RoundResult[];
  champion: MockPlayer;
  runnerUp: MockPlayer;
  prizePool: number;
  protocolFee: number;
  disbursements: PrizeDisbursement[];
  /** Any accounting mismatches found during verification — empty on a clean run. */
  issues: string[];
  transcript: string[];
}
