export interface LeaderboardPrizeTickerProps {
  prizePoolXlm: number;
  targetResetTs: string;
  userRank?: number;
  topPrizes: number[];
  className?: string;
  testId?: string;
}

export interface PrizeDistribution {
  place: 1 | 2 | 3;
  percentage: number;
  amountXlm: number;
}