export type CheerType = 'clap' | 'fire' | 'diamond';

export interface CheerReaction {
  id: string;
  type: CheerType;
  x: number;
  y: number;
  createdAt: number;
}

export interface TurnAction {
  playerId: string;
  playerName: string;
  action: string;
  timestamp: number;
}

export interface LiveMatchData {
  matchId: string;
  player1: string;
  player2: string;
  potAmount: number;
  currentTurn: string;
  turnActions: TurnAction[];
  elapsedSeconds: number;
}

export interface SpectatorCheerViewProps {
  match: LiveMatchData;
  viewerCount: number;
  onSendCheer: (cheerType: CheerType) => void;
  onLeaveSpectator: () => void;
  className?: string;
  testId?: string;
}
