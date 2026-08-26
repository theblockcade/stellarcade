export interface BracketPlayer {
  id: string;
  username: string;
  avatarUrl?: string;
  score?: number;
}

export interface BracketMatchup {
  id: string;
  player1?: BracketPlayer;
  player2?: BracketPlayer;
  winnerId?: string;
  isCompleted: boolean;
  nextMatchupId?: string;
}

export interface BracketRound {
  roundNumber: number;
  title: string;
  matchups: BracketMatchup[];
}

export interface BracketTree {
  id: string;
  name: string;
  rounds: BracketRound[];
}

export interface TournamentBracketTreeProps {
  bracketData: BracketTree;
  onSelectMatchup: (matchupId: string) => void;
  highlightPlayerId?: string;
}
