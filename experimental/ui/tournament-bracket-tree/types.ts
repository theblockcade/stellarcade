export interface TournamentPlayer {
  id: string;
  name: string;
  avatar?: string;
}

export interface TournamentMatch {
  id: string;
  round: number;
  matchIndex: number;
  players: [TournamentPlayer | null, TournamentPlayer | null];
  scores?: [number | null, number | null];
  winnerId?: string | null;
  status?: 'pending' | 'live' | 'completed';
}

export interface TournamentRound {
  id: string;
  name: string;
  matches: TournamentMatch[];
}

export type BracketView = 'compact' | 'full';

export interface TournamentBracketTreeProps {
  rounds: TournamentRound[];
  activeMatchId?: string;
  onSelectMatch?: (match: TournamentMatch) => void;
  className?: string;
  testId?: string;
  defaultView?: BracketView;
}