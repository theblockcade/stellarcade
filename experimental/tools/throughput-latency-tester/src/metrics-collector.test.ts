import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector, percentile } from './metrics-collector';
import type { TransactionResult } from './types';

function makeResult(overrides: Partial<TransactionResult> = {}): TransactionResult {
  return {
    id: 'tx_0',
    success: true,
    submissionMs: 10,
    inclusionMs: 20,
    simulationMs: 15,
    totalMs: 45,
    ...overrides,
  };
}

describe('percentile', () => {
  it('returns 0 for an empty array', () => {
    expect(percentile([], 50)).toBe(0);
  });

  it('returns the single value for a one-element array', () => {
    expect(percentile([42], 99)).toBe(42);
  });

  it('computes p50 (median) for an odd-length sorted array', () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });

  it('computes p95 and p99 for a larger sorted array', () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(sorted, 95)).toBe(95);
    expect(percentile(sorted, 99)).toBe(99);
  });

  it('clamps percentile input above 100 and below 0', () => {
    const sorted = [10, 20, 30];
    expect(percentile(sorted, 150)).toBe(30);
    expect(percentile(sorted, -20)).toBe(10);
  });

  it('handles p90 correctly', () => {
    const sorted = Array.from({ length: 10 }, (_, i) => (i + 1) * 10);
    expect(percentile(sorted, 90)).toBe(90);
  });
});

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  it('returns empty summary when no transactions recorded', () => {
    const summary = collector.getSummary();
    expect(summary.totalRequests).toBe(0);
    expect(summary.successCount).toBe(0);
    expect(summary.failureCount).toBe(0);
    expect(summary.peakTps).toBe(0);
    expect(summary.sustainedTps).toBe(0);
    expect(summary.avgLatencyMs).toBe(0);
    expect(summary.percentiles).toEqual({ p50: 0, p90: 0, p95: 0, p99: 0 });
    expect(summary.latencyHistogram).toEqual([]);
  });

  it('records a single successful transaction', () => {
    collector.markRunStart();
    collector.recordTransaction(makeResult({ totalMs: 30, success: true }));
    collector.markRunEnd();

    const summary = collector.getSummary();
    expect(summary.totalRequests).toBe(1);
    expect(summary.successCount).toBe(1);
    expect(summary.failureCount).toBe(0);
    expect(summary.avgLatencyMs).toBe(30);
  });

  it('records a single failed transaction', () => {
    collector.markRunStart();
    collector.recordTransaction(makeResult({ totalMs: 50, success: false, error: 'fail' }));
    collector.markRunEnd();

    const summary = collector.getSummary();
    expect(summary.totalRequests).toBe(1);
    expect(summary.successCount).toBe(0);
    expect(summary.failureCount).toBe(1);
  });

  it('calculates percentiles correctly from known values', () => {
    const results: TransactionResult[] = [];
    for (let i = 1; i <= 100; i++) {
      results.push(makeResult({ id: `tx_${i}`, totalMs: i }));
    }

    collector.markRunStart();
    for (const r of results) {
      collector.recordTransaction(r);
    }
    collector.markRunEnd();

    const percentiles = collector.calculatePercentiles(results);
    expect(percentiles.p50).toBe(50);
    expect(percentiles.p90).toBe(90);
    expect(percentiles.p95).toBe(95);
    expect(percentiles.p99).toBe(99);
  });

  it('builds histogram with 10ms buckets', () => {
    const results: TransactionResult[] = [
      makeResult({ totalMs: 5 }),
      makeResult({ totalMs: 15 }),
      makeResult({ totalMs: 15 }),
      makeResult({ totalMs: 25 }),
    ];

    const histogram = collector.buildHistogram(results);
    expect(histogram.length).toBe(3);
    expect(histogram[0].range).toBe('0-10ms');
    expect(histogram[0].count).toBe(1);
    expect(histogram[1].range).toBe('10-20ms');
    expect(histogram[1].count).toBe(2);
    expect(histogram[2].range).toBe('20-30ms');
    expect(histogram[2].count).toBe(1);
  });

  it('builds empty histogram for empty results', () => {
    expect(collector.buildHistogram([])).toEqual([]);
  });

  it('calculates peak and sustained TPS', () => {
    collector.markRunStart();
    for (let i = 0; i < 10; i++) {
      collector.recordTransaction(makeResult({
        id: `tx_${i}`,
        totalMs: 50,
        success: true,
      }));
    }
    collector.markRunEnd();

    const tps = collector.calculateTps(
      Array.from({ length: 10 }, (_, i) => makeResult({ id: `tx_${i}`, totalMs: 50, success: true }))
    );
    expect(tps.peak).toBeGreaterThanOrEqual(0);
    expect(tps.sustained).toBeGreaterThanOrEqual(0);
  });

  it('returns zero TPS for empty results', () => {
    const tps = collector.calculateTps([]);
    expect(tps.peak).toBe(0);
    expect(tps.sustained).toBe(0);
  });

  it('reset clears all state', () => {
    collector.markRunStart();
    collector.recordTransaction(makeResult({ totalMs: 30 }));
    collector.markRunEnd();

    collector.reset();

    const summary = collector.getSummary();
    expect(summary.totalRequests).toBe(0);
    expect(summary.successCount).toBe(0);
    expect(summary.failureCount).toBe(0);
  });

  it('handles all failures correctly', () => {
    collector.markRunStart();
    collector.recordTransaction(makeResult({ totalMs: 20, success: false, error: 'e1' }));
    collector.recordTransaction(makeResult({ totalMs: 30, success: false, error: 'e2' }));
    collector.markRunEnd();

    const summary = collector.getSummary();
    expect(summary.totalRequests).toBe(2);
    expect(summary.successCount).toBe(0);
    expect(summary.failureCount).toBe(2);
  });

  it('computes average latency across mixed results', () => {
    collector.markRunStart();
    collector.recordTransaction(makeResult({ totalMs: 10 }));
    collector.recordTransaction(makeResult({ totalMs: 20 }));
    collector.recordTransaction(makeResult({ totalMs: 30 }));
    collector.markRunEnd();

    const summary = collector.getSummary();
    expect(summary.avgLatencyMs).toBe(20);
  });

  it('handles single result for percentile calculation', () => {
    const percentiles = collector.calculatePercentiles([makeResult({ totalMs: 42 })]);
    expect(percentiles.p50).toBe(42);
    expect(percentiles.p90).toBe(42);
    expect(percentiles.p95).toBe(42);
    expect(percentiles.p99).toBe(42);
  });
});
