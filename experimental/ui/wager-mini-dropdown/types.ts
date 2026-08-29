export type WagerMiniOutcome = 'won' | 'lost' | 'refund';

export interface WagerSummary {
  id: string;
  gameName: string;
  gameIcon: string;
  timestamp: string;
  wagerAmountXlm: number;
  netProfitXlm: number;
  outcome: WagerMiniOutcome;
  txHash: string;
}

export interface WagerMiniDropdownProps {
  recentWagers: WagerSummary[];
  onViewFullHistory: () => void;
  onSelectWager?: (txHash: string) => void;
  explorerBaseUrl?: string;
  className?: string;
  testId?: string;
}