import { describe, it, expect } from 'vitest';
import { MetricsCollector, percentile, percentileStats, safeRate } from './metrics';

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
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
    expect(percentile(sorted, 95)).toBe(95);
    expect(percentile(sorted, 99)).toBe(99);
  });

  it('clamps percentile input above 100 and below 0', () => {
    const sorted = [10, 20, 30];
    expect(percentile(sorted, 150)).toBe(30);
    expect(percentile(sorted, -20)).toBe(10);
  });
});

describe('percentileStats', () => {
  it('returns all-zero stats for an empty sample set', () => {
    const stats = percentileStats([]);
    expect(stats).toEqual({ count: 0, min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 });
  });

  it('computes min/max/mean correctly', () => {
    const stats = percentileStats([10, 20, 30, 40]);
    expect(stats.count).toBe(4);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(40);
    expect(stats.mean).toBe(25);
  });

  it('does not mutate the input array', () => {
    const samples = [5, 3, 1, 4, 2];
    percentileStats(samples);
    expect(samples).toEqual([5, 3, 1, 4, 2]);
  });
});

describe('safeRate', () => {
  it('returns 0 when denominator is zero', () => {
    expect(safeRate(5, 0)).toBe(0);
  });

  it('returns 0 when denominator is negative', () => {
    expect(safeRate(5, -3)).toBe(0);
  });

  it('computes the correct ratio otherwise', () => {
    expect(safeRate(1, 4)).toBe(0.25);
  });
});

describe('MetricsCollector', () => {
  it('summarizes an all-success run correctly', () => {
    const collector = new MetricsCollector();
    collector.recordQueueWait(100);
    collector.recordQueueWait(200);
    collector.recordPairingLatency(50);
    collector.recordMatchCompleted();
    collector.recordMatchCompleted();

    const summary = collector.summarize(2);

    expect(summary.totalPlayers).toBe(2);
    expect(summary.completedMatches).toBe(2);
    expect(summary.timeouts).toBe(0);
    expect(summary.disconnects).toBe(0);
    expect(summary.errors).toBe(0);
    expect(summary.errorRate).toBe(0);
    expect(summary.timeoutRate).toBe(0);
    expect(summary.queueWaitMs.count).toBe(2);
    expect(summary.pairingLatencyMs.count).toBe(1);
  });

  it('handles a run with zero players without crashing or dividing by zero', () => {
    const collector = new MetricsCollector();
    const summary = collector.summarize(0);

    expect(summary.totalPlayers).toBe(0);
    expect(summary.errorRate).toBe(0);
    expect(summary.timeoutRate).toBe(0);
    expect(summary.queueWaitMs.count).toBe(0);
  });

  it('tracks disconnects, timeouts, and errors independently', () => {
    const collector = new MetricsCollector();
    collector.recordDisconnect();
    collector.recordDisconnect();
    collector.recordTimeout();
    collector.recordError();
    collector.recordMatchCompleted();

    const summary = collector.summarize(5);

    expect(summary.disconnects).toBe(2);
    expect(summary.timeouts).toBe(1);
    expect(summary.errors).toBe(1);
    expect(summary.completedMatches).toBe(1);
    expect(summary.errorRate).toBe(0.2);
    expect(summary.timeoutRate).toBe(0.2);
    expect(summary.totalOutcomes).toBe(4);
  });

  it('ignores negative or non-finite queue wait / pairing latency samples', () => {
    const collector = new MetricsCollector();
    collector.recordQueueWait(-10);
    collector.recordQueueWait(NaN);
    collector.recordQueueWait(Infinity);
    collector.recordQueueWait(50);
    collector.recordPairingLatency(-5);

    const summary = collector.summarize(1);

    expect(summary.queueWaitMs.count).toBe(1);
    expect(summary.queueWaitMs.min).toBe(50);
    expect(summary.pairingLatencyMs.count).toBe(0);
  });

  it('reports sample counts via getSampleCounts', () => {
    const collector = new MetricsCollector();
    collector.recordQueueWait(10);
    collector.recordQueueWait(20);
    collector.recordPairingLatency(30);

    expect(collector.getSampleCounts()).toEqual({ queueWait: 2, pairingLatency: 1 });
  });

  it('includes a non-negative durationMs in the summary', () => {
    const collector = new MetricsCollector();
    const summary = collector.summarize(0);
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);
  });
});
