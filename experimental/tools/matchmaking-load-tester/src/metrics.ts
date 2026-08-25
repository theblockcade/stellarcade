import type { LoadTestSummary, MetricSample, PercentileStats } from './types';

/**
 * Collects timing and outcome samples for a load test run and produces
 * an aggregate statistical summary on demand.
 *
 * Designed to never throw: disconnects, timeouts, and failed match
 * attempts are recorded as samples/counters rather than propagated as
 * exceptions, so a single virtual player failure can never crash the run.
 */
export class MetricsCollector {
  private queueWaitMs: number[] = [];
  private pairingLatencyMs: number[] = [];
  private timeouts = 0;
  private disconnects = 0;
  private errors = 0;
  private completedMatches = 0;
  private startedAt = Date.now();

  recordQueueWait(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) return;
    this.queueWaitMs.push(ms);
  }

  recordPairingLatency(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) return;
    this.pairingLatencyMs.push(ms);
  }

  recordTimeout(): void {
    this.timeouts++;
  }

  recordDisconnect(): void {
    this.disconnects++;
  }

  recordError(): void {
    this.errors++;
  }

  recordMatchCompleted(): void {
    this.completedMatches++;
  }

  getSampleCounts(): { queueWait: number; pairingLatency: number } {
    return {
      queueWait: this.queueWaitMs.length,
      pairingLatency: this.pairingLatencyMs.length,
    };
  }

  /**
   * Builds the final aggregate report. Safe to call with zero samples
   * (e.g. every virtual player failed before joining a queue).
   */
  summarize(totalPlayers: number): LoadTestSummary {
    const totalAttempts = totalPlayers;
    const totalOutcomes = this.completedMatches + this.timeouts + this.disconnects + this.errors;
    const errorRate = totalAttempts > 0 ? this.errors / totalAttempts : 0;
    const timeoutRate = totalAttempts > 0 ? this.timeouts / totalAttempts : 0;

    return {
      totalPlayers,
      completedMatches: this.completedMatches,
      timeouts: this.timeouts,
      disconnects: this.disconnects,
      errors: this.errors,
      timeoutRate,
      errorRate,
      totalOutcomes,
      durationMs: Date.now() - this.startedAt,
      queueWaitMs: percentileStats(this.queueWaitMs),
      pairingLatencyMs: percentileStats(this.pairingLatencyMs),
    };
  }
}

/**
 * Computes count/min/max/mean/p50/p95/p99 for a set of millisecond samples
 * using nearest-rank percentile interpolation. Returns an all-zero stats
 * object (rather than throwing/NaN) when given an empty array.
 */
export function percentileStats(samples: number[]): PercentileStats {
  if (samples.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

/**
 * Nearest-rank percentile over a pre-sorted ascending array.
 */
export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];

  const clampedP = Math.min(100, Math.max(0, p));
  const rank = Math.ceil((clampedP / 100) * sortedAsc.length);
  const index = Math.min(sortedAsc.length - 1, Math.max(0, rank - 1));
  return sortedAsc[index];
}

/**
 * Convenience helper for computing an error rate that never divides by zero.
 */
export function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export type { MetricSample };
