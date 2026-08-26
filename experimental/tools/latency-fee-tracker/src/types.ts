export interface TrackerOptions {
  rpcUrl: string;
  ledgers: number;
  jsonOut?: string;
}

export interface TransactionFeeRecord {
  hash: string;
  feeCharged: number;
  maxFee: number;
  latencyMs: number;
}

export interface LedgerSample {
  sequence: number;
  closedAt: string;
  transactionCount: number;
  avgLatencyMs: number;
  transactions: TransactionFeeRecord[];
}

export interface LatencyFeeMetrics {
  sampledLedgersCount: number;
  totalTransactionsProcessed: number;
  avgLatencyMs: number;
  avgFeeStroops: number;
  minFeeStroops: number;
  maxFeeStroops: number;
  timestamp: string;
  rpcUrl: string;
  ledgers: LedgerSample[];
}
