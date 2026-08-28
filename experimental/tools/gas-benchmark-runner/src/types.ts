export interface BenchmarkOptions {
  contract: string;
  method: string;
  iterations: number;
  concurrency: number;
  rpcUrl: string;
  output?: string;
}

export interface InvocationResult {
  id: string;
  success: boolean;
  latencyMs: number;
  cpuInstructions: number;
  memoryBytes: number;
  resourceFeeStroops: number;
  error?: string;
}

export interface LatencyPercentiles {
  p50: number;
  p90: number;
  p99: number;
}

export interface BenchmarkReport {
  contract: string;
  method: string;
  iterations: number;
  concurrency: number;
  timestamp: string;
  successCount: number;
  failureCount: number;
  latency: {
    avgMs: number;
    minMs: number;
    maxMs: number;
    percentiles: LatencyPercentiles;
  };
  cpuInstructions: {
    avg: number;
    min: number;
    max: number;
    percentiles: LatencyPercentiles;
  };
  memoryBytes: {
    avg: number;
    min: number;
    max: number;
  };
  resourceFee: {
    avgStroops: number;
    minStroops: number;
    maxStroops: number;
    totalStroops: number;
  };
}
