export type BetMode = "single" | "multi";

export interface BetSelection {
  id: string;
  gameTitle: string;
  selectionLabel: string;
  /** Decimal odds multiplier, e.g. 2.5 means a 100 stake returns 250. */
  odds: number;
  stake: number;
}

export interface WagerBetSlipProps {
  isOpen: boolean;
  selections: BetSelection[];
  availableBalance: number;
  onUpdateStake: (id: string, stake: number) => void;
  onRemove: (id: string) => void;
  onSubmitBets: () => Promise<void>;
  onClose?: () => void;
}

export interface BetSlipItemProps {
  selection: BetSelection;
  onUpdateStake: (id: string, stake: number) => void;
  onRemove: (id: string) => void;
}

export interface BetSlipSummary {
  totalStake: number;
  /** Combined multiplier across all selections in multi/parlay mode. */
  combinedOdds: number;
  estimatedPayout: number;
  potentialProfit: number;
}
