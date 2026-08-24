export type EventType = 
  | 'match_started'
  | 'wager_deposited'
  | 'round_settled'
  | 'jackpot_won';

export interface EventConfig {
  eventType: EventType;
  intervalMs: number;
  count: number;
  rpcUrl: string;
  contractId: string;
  randomPayload?: boolean;
  jsonMode?: boolean;
}

export interface MockEvent {
  type: EventType;
  timestamp: string;
  contractId: string;
  payload: Record<string, any>;
}

export interface PlayerAddress {
  publicKey: string;
  secretKey?: string;
}

export interface WagerAmount {
  amount: string;
  asset: string;
}

export interface MatchStartedPayload {
  matchId: string;
  player: PlayerAddress;
  wager: WagerAmount;
  gameType: string;
}

export interface WagerDepositedPayload {
  matchId: string;
  player: PlayerAddress;
  amount: WagerAmount;
  timestamp: string;
}

export interface RoundSettledPayload {
  matchId: string;
  winner: PlayerAddress;
  loser: PlayerAddress;
  result: string;
  payout: WagerAmount;
}

export interface JackpotWonPayload {
  matchId: string;
  winner: PlayerAddress;
  jackpotAmount: WagerAmount;
  totalPlayers: number;
}