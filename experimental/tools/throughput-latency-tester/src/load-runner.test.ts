import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoadRunner } from './load-runner';
import { MetricsCollector } from './metrics-collector';
import type { ThroughputConfig } from './types';

function makeConfig(overrides: Partial<ThroughputConfig> = {}): ThroughputConfig {
  return {
    rpcUrl: 'http://localhost:8000/soroban/rpc',
    contractId: 'CABC123',
    method: 'transfer',
    totalRequests: 5,
    concurrency: 2,
    rampUpMs: 0,
    ...overrides,
  };
}

describe('LoadRunner', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  it('records all transactions in the MetricsCollector', async () => {
    vi.useFakeTimers();
    const config = makeConfig({ totalRequests: 10, concurrency: 5, rampUpMs: 0 });
    const runner = new LoadRunner(config, collector);

    const promise = runner.run();
    await vi.advanceTimersByTimeAsync(10000);
    const summary = await promise;
    vi.useRealTimers();

    expect(summary.totalRequests).toBe(10);
    expect(summary.successCount + summary.failureCount).toBe(10);
  });

  it('respects concurrency limit', async () => {
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    const originalSimulate = LoadRunner.prototype.simulateTransaction;
    LoadRunner.prototype.simulateTransaction = async function (id: number) {
      currentConcurrent++;
      if (currentConcurrent > maxConcurrent) {
        maxConcurrent = currentConcurrent;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
      currentConcurrent--;
      return originalSimulate.call(this, id);
    };

    vi.useFakeTimers();
    const config = makeConfig({ totalRequests: 10, concurrency: 3, rampUpMs: 0 });
    const runner = new LoadRunner(config, collector);

    const promise = runner.run();
    await vi.advanceTimersByTimeAsync(20000);
    await promise;
    vi.useRealTimers();

    expect(maxConcurrent).toBeLessThanOrEqual(3);

    LoadRunner.prototype.simulateTransaction = originalSimulate;
  });

  it('tracks both successful and failed transactions', async () => {
    vi.useFakeTimers();
    const config = makeConfig({ totalRequests: 20, concurrency: 10, rampUpMs: 0 });
    const runner = new LoadRunner(config, collector);

    const promise = runner.run();
    await vi.advanceTimersByTimeAsync(10000);
    const summary = await promise;
    vi.useRealTimers();

    expect(summary.totalRequests).toBe(20);
    expect(summary.successCount + summary.failureCount).toBe(20);
    expect(summary.successCount).toBeGreaterThan(0);
  });

  it('produces a valid MetricsSummary', async () => {
    vi.useFakeTimers();
    const config = makeConfig({ totalRequests: 8, concurrency: 4, rampUpMs: 0 });
    const runner = new LoadRunner(config, collector);

    const promise = runner.run();
    await vi.advanceTimersByTimeAsync(10000);
    const summary = await promise;
    vi.useRealTimers();

    expect(summary).toHaveProperty('totalRequests');
    expect(summary).toHaveProperty('successCount');
    expect(summary).toHaveProperty('failureCount');
    expect(summary).toHaveProperty('peakTps');
    expect(summary).toHaveProperty('sustainedTps');
    expect(summary).toHaveProperty('avgLatencyMs');
    expect(summary).toHaveProperty('percentiles');
    expect(summary).toHaveProperty('latencyHistogram');
    expect(summary.percentiles).toHaveProperty('p50');
    expect(summary.percentiles).toHaveProperty('p90');
    expect(summary.percentiles).toHaveProperty('p95');
    expect(summary.percentiles).toHaveProperty('p99');
  });

  it('simulateTransaction returns valid TransactionResult', async () => {
    const config = makeConfig();
    const runner = new LoadRunner(config, collector);

    const result = await runner.simulateTransaction(42);
    expect(result.id).toBe('tx_42');
    expect(typeof result.submissionMs).toBe('number');
    expect(typeof result.inclusionMs).toBe('number');
    expect(typeof result.simulationMs).toBe('number');
    expect(typeof result.totalMs).toBe('number');
    expect(result.totalMs).toBe(result.submissionMs + result.inclusionMs + result.simulationMs);
    expect(typeof result.success).toBe('boolean');
  });

  it('handles single transaction correctly', async () => {
    vi.useFakeTimers();
    const config = makeConfig({ totalRequests: 1, concurrency: 1, rampUpMs: 0 });
    const runner = new LoadRunner(config, collector);

    const promise = runner.run();
    await vi.advanceTimersByTimeAsync(5000);
    const summary = await promise;
    vi.useRealTimers();

    expect(summary.totalRequests).toBe(1);
    expect(summary.successCount + summary.failureCount).toBe(1);
  });

  it('handles zero ramp-up (no gradual increase)', async () => {
    vi.useFakeTimers();
    const config = makeConfig({ totalRequests: 5, concurrency: 3, rampUpMs: 0 });
    const runner = new LoadRunner(config, collector);

    const promise = runner.run();
    await vi.advanceTimersByTimeAsync(5000);
    const summary = await promise;
    vi.useRealTimers();

    expect(summary.totalRequests).toBe(5);
  });
});
