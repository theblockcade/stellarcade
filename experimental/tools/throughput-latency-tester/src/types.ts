export interface TransactionResult {
  id: string;
  success: boolean;
  submissionMs: number;
  inclusionMs: number;
  simulationMs: number;
  totalMs: number;
  error?: string;
}

export interface ThroughputConfig {
  rpcUrl: string;
  contractId: string;
  method: string;
  totalRequests: number;
  concurrency: number;
  rampUpMs: number;
}

export interface MetricsSummary {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  peakTps: number;
  sustainedTps: number;
  avgLatencyMs: number;
  percentiles: LatencyPercentiles;
  latencyHistogram: HistogramBucket[];
}

export interface LatencyPercentiles {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface HistogramBucket {
  range: string;
  count: number;
  percentage: number;
}
