import type { TransactionResult, MetricsSummary, LatencyPercentiles, HistogramBucket } from './types';

export class MetricsCollector {
  private results: TransactionResult[] = [];
  private runStartedAt = 0;
  private runEndedAt = 0;

  recordTransaction(result: TransactionResult): void {
    this.results.push(result);
  }

  markRunStart(): void {
    this.runStartedAt = Date.now();
  }

  markRunEnd(): void {
    this.runEndedAt = Date.now();
  }

  getSummary(): MetricsSummary {
    const total = this.results.length;
    const successCount = this.results.filter((r) => r.success).length;
    const failureCount = total - successCount;

    const latencies = this.results.map((r) => r.totalMs);
    const avgLatencyMs = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    const { peak, sustained } = this.calculateTps(this.results);
    const percentiles = this.calculatePercentiles(this.results);
    const latencyHistogram = this.buildHistogram(this.results);

    return {
      totalRequests: total,
      successCount,
      failureCount,
      peakTps: peak,
      sustainedTps: sustained,
      avgLatencyMs,
      percentiles,
      latencyHistogram,
    };
  }

  calculatePercentiles(results: TransactionResult[]): LatencyPercentiles {
    if (results.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = results
      .map((r) => r.totalMs)
      .sort((a, b) => a - b);

    return {
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    };
  }

  buildHistogram(results: TransactionResult[]): HistogramBucket[] {
    if (results.length === 0) {
      return [];
    }

    const latencies = results.map((r) => r.totalMs);
    const maxLatency = Math.max(...latencies);
    const bucketSize = 10;
    const bucketCount = Math.max(1, Math.ceil(maxLatency / bucketSize));

    const buckets: HistogramBucket[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const lo = i * bucketSize;
      const hi = (i + 1) * bucketSize;
      const range = `${lo}-${hi}ms`;
      const count = latencies.filter((l) => l >= lo && l < hi).length;
      const percentage = results.length > 0 ? (count / results.length) * 100 : 0;
      buckets.push({ range, count, percentage });
    }

    const lastBucket = buckets[buckets.length - 1];
    if (lastBucket) {
      const lastLo = (bucketCount - 1) * bucketSize;
      const lastCount = latencies.filter((l) => l >= lastLo).length;
      lastBucket.count = lastCount;
      lastBucket.percentage = results.length > 0 ? (lastCount / results.length) * 100 : 0;
    }

    return buckets;
  }

  calculateTps(results: TransactionResult[]): { peak: number; sustained: number } {
    if (results.length === 0) {
      return { peak: 0, sustained: 0 };
    }

    const windowSizeMs = 1000;
    const timestamps = results
      .map((r) => r.totalMs)
      .sort((a, b) => a - b);

    const minTs = Math.min(...this.results.map(() => this.runStartedAt));
    const maxTs = this.runEndedAt > 0 ? this.runEndedAt : Date.now();
    const durationMs = maxTs - minTs;

    if (durationMs <= 0) {
      return { peak: 0, sustained: 0 };
    }

    let peak = 0;
    for (let start = minTs; start <= maxTs; start += windowSizeMs) {
      const end = start + windowSizeMs;
      const inWindow = this.results.filter((r) => {
        const ts = minTs + (r.totalMs / timestamps[timestamps.length - 1]) * durationMs;
        return ts >= start && ts < end;
      }).length;
      if (inWindow > peak) {
        peak = inWindow;
      }
    }

    const successResults = this.results.filter((r) => r.success);
    const sustained = successResults.length > 0
      ? (successResults.length / (durationMs / 1000))
      : 0;

    return { peak, sustained };
  }

  reset(): void {
    this.results = [];
    this.runStartedAt = 0;
    this.runEndedAt = 0;
  }
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];

  const clampedP = Math.min(100, Math.max(0, p));
  const rank = Math.ceil((clampedP / 100) * sortedAsc.length);
  const index = Math.min(sortedAsc.length - 1, Math.max(0, rank - 1));
  return sortedAsc[index];
}
