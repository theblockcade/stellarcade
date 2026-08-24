export type Size = 'sm' | 'md' | 'lg';

export interface RankHistoryPoint {
  date: string;
  rank: number;
}

export interface LeaderboardRankDeltaProps {
  currentRank: number;
  previousRank: number;
  history?: RankHistoryPoint[];
  size?: Size;
  className?: string;
  testId?: string;
}

export interface DeltaInfo {
  delta: number;
  direction: 'up' | 'down' | 'neutral';
  isNewEntry: boolean;
  isTopThree: boolean;
}