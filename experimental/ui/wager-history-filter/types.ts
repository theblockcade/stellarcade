export type WagerOutcome = 'won' | 'lost' | 'drawn';

export interface WagerRecord {
  id: string;
  /** ISO 8601 timestamp of the match. */
  timestamp: string;
  gameName: string;
  wagerAmount: number;
  /** Positive on a win, negative on a loss, 0 on a draw/refund. */
  netPayout: number;
  outcome: WagerOutcome;
  txHash: string;
}

export type OutcomeFilter = 'all' | WagerOutcome;

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface HistoryFilters {
  game: string;
  outcome: OutcomeFilter;
  dateRange: DateRange;
}

export interface WagerHistoryFilterProps {
  records: WagerRecord[];
  onFilterChange?: (filters: HistoryFilters) => void;
  pageSize?: number;
  className?: string;
  testId?: string;
}

export interface WagerHistoryTableProps {
  records: WagerRecord[];
  pageSize?: number;
  txExplorerBaseUrl?: string;
  testId?: string;
}
