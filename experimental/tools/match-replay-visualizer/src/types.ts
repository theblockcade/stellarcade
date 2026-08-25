export type SupportedGameType = 'rock-paper-scissors' | 'dice' | 'matrix' | 'trivia';

/** One recorded player action within a match, in chronological order. */
export interface MatchMove {
  moveIndex: number;
  player: string;
  timestamp: string;
  /** Game-specific move data — shape depends on `gameType`. */
  data: Record<string, unknown>;
}

export interface MatchRecord {
  matchId: string;
  gameType: SupportedGameType;
  players: string[];
  wagerXlm: number;
  moves: MatchMove[];
  /** Present only once the match has settled on-chain. */
  outcome?: {
    winner: string | 'draw';
    settledAt: string;
  };
}

/**
 * A single step in the replay: the board/game state resulting from applying
 * `moves[0..stepIndex]`, plus a human-readable rendering of it.
 */
export interface ReplayStep {
  stepIndex: number;
  move: MatchMove | null; // null for the initial state (before any move)
  render: string;
}

export type ReplayNavigationAction = 'next' | 'previous' | 'jump-to-end' | 'jump-to-start';
