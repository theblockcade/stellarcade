import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  mean,
  median,
  percentile,
  calculatePercentiles,
  runBenchmark,
  buildReport,
  formatMarkdownSummary,
  writeReportToJson,
  writeMarkdownSummary,
} from './benchmark.js';
import type { InvocationResult, BenchmarkOptions } from './types.js';

describe('statistical calculation utilities', () => {
  describe('mean', () => {
    it('computes the arithmetic mean of a set of values', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
      expect(mean([10, 20])).toBe(15);
    });

    it('returns 0 for an empty array', () => {
      expect(mean([])).toBe(0);
    });

    it('handles a single value', () => {
      expect(mean([42])).toBe(42);
    });
  });

  describe('median', () => {
    it('returns the middle value for an odd-length array', () => {
      expect(median([5, 1, 3])).toBe(3);
    });

    it('returns a value near the midpoint for an even-length array (nearest-rank)', () => {
      // nearest-rank p50 of [1,2,3,4] -> rank = ceil(0.5*4) = 2 -> sorted[1] = 2
      expect(median([1, 2, 3, 4])).toBe(2);
    });

    it('returns 0 for an empty array', () => {
      expect(median([])).toBe(0);
    });

    it('does not mutate the input array', () => {
      const input = [5, 3, 1, 4, 2];
      const copy = [...input];
      median(input);
      expect(input).toEqual(copy);
    });
  });

  describe('percentile', () => {
    it('returns the minimum for p0', () => {
      const sorted = [10, 20, 30, 40, 50];
      expect(percentile(sorted, 0)).toBe(10);
    });

    it('returns the maximum for p100', () => {
      const sorted = [10, 20, 30, 40, 50];
      expect(percentile(sorted, 100)).toBe(50);
    });

    it('computes p90 using nearest-rank on a 10-element array', () => {
      const sorted = Array.from({ length: 10 }, (_, i) => (i + 1) * 10); // 10..100
      // rank = ceil(0.9 * 10) = 9 -> sorted[8] = 90
      expect(percentile(sorted, 90)).toBe(90);
    });

    it('computes p99 using nearest-rank on a 100-element array', () => {
      const sorted = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
      // rank = ceil(0.99 * 100) = 99 -> sorted[98] = 99
      expect(percentile(sorted, 99)).toBe(99);
    });

    it('returns 0 for an empty array', () => {
      expect(percentile([], 50)).toBe(0);
    });

    it('returns the single value regardless of percentile requested', () => {
      expect(percentile([7], 1)).toBe(7);
      expect(percentile([7], 99)).toBe(7);
    });

    it('clamps out-of-range percentiles', () => {
      const sorted = [1, 2, 3];
      expect(percentile(sorted, -10)).toBe(percentile(sorted, 0));
      expect(percentile(sorted, 150)).toBe(percentile(sorted, 100));
    });
  });

  describe('calculatePercentiles', () => {
    it('computes p50/p90/p99 in one call', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const result = calculatePercentiles(values);
      expect(result.p50).toBe(50);
      expect(result.p90).toBe(90);
      expect(result.p99).toBe(99);
    });

    it('returns all zeros for empty input', () => {
      expect(calculatePercentiles([])).toEqual({ p50: 0, p90: 0, p99: 0 });
    });

    it('does not mutate the input array', () => {
      const input = [30, 10, 20];
      const copy = [...input];
      calculatePercentiles(input);
      expect(input).toEqual(copy);
    });
  });
});

describe('runBenchmark (mock integration)', () => {
  const makeMockInvocation = (
    overrides: Partial<InvocationResult> = {}
  ): ((contract: string, method: string, id: number) => Promise<InvocationResult>) => {
    return async (contract, method, id) => ({
      id: `${contract}:${method}:${id}`,
      success: true,
      latencyMs: 100,
      cpuInstructions: 1_000_000,
      memoryBytes: 100_000,
      resourceFeeStroops: 100,
      ...overrides,
    });
  };

  const baseOptions: BenchmarkOptions = {
    contract: 'CTESTCONTRACT',
    method: 'transfer',
    iterations: 20,
    concurrency: 5,
    rpcUrl: 'https://soroban-testnet.stellar.org',
  };

  it('runs the requested number of iterations using an injected simulate function', async () => {
    const mockSimulate = vi.fn(makeMockInvocation());
    const results = await runBenchmark(baseOptions, mockSimulate);

    expect(results).toHaveLength(20);
    expect(mockSimulate).toHaveBeenCalledTimes(20);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('never exceeds the configured concurrency limit', async () => {
    let inFlight = 0;
    let maxObservedConcurrency = 0;

    const trackedSimulate = async (
      contract: string,
      method: string,
      id: number
    ): Promise<InvocationResult> => {
      inFlight++;
      maxObservedConcurrency = Math.max(maxObservedConcurrency, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return {
        id: `${contract}:${method}:${id}`,
        success: true,
        latencyMs: 5,
        cpuInstructions: 500_000,
        memoryBytes: 50_000,
        resourceFeeStroops: 50,
      };
    };

    await runBenchmark({ ...baseOptions, iterations: 30, concurrency: 4 }, trackedSimulate);

    expect(maxObservedConcurrency).toBeLessThanOrEqual(4);
  });

  it('preserves result ordering by iteration id', async () => {
    const mockSimulate = async (
      contract: string,
      method: string,
      id: number
    ): Promise<InvocationResult> => ({
      id: `${contract}:${method}:${id}`,
      success: true,
      latencyMs: id, // encode id in latency to verify ordering after concurrent completion
      cpuInstructions: 1,
      memoryBytes: 1,
      resourceFeeStroops: 1,
    });

    const results = await runBenchmark({ ...baseOptions, iterations: 10, concurrency: 3 }, mockSimulate);

    expect(results.map((r) => r.latencyMs)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('captures failures reported by the simulate function', async () => {
    const flakySimulate = async (
      contract: string,
      method: string,
      id: number
    ): Promise<InvocationResult> => ({
      id: `${contract}:${method}:${id}`,
      success: id % 2 === 0,
      latencyMs: 50,
      cpuInstructions: id % 2 === 0 ? 1_000_000 : 0,
      memoryBytes: id % 2 === 0 ? 100_000 : 0,
      resourceFeeStroops: id % 2 === 0 ? 100 : 0,
      error: id % 2 === 0 ? undefined : 'RPC simulation error',
    });

    const results = await runBenchmark({ ...baseOptions, iterations: 10, concurrency: 2 }, flakySimulate);
    const failures = results.filter((r) => !r.success);

    expect(failures).toHaveLength(5);
    expect(failures.every((r) => r.error === 'RPC simulation error')).toBe(true);
  });

  it('rejects a non-positive iterations count', async () => {
    await expect(
      runBenchmark({ ...baseOptions, iterations: 0 }, makeMockInvocation())
    ).rejects.toThrow('iterations must be a positive integer');
  });

  it('rejects a non-positive concurrency value', async () => {
    await expect(
      runBenchmark({ ...baseOptions, concurrency: 0 }, makeMockInvocation())
    ).rejects.toThrow('concurrency must be a positive integer');
  });
});

describe('buildReport', () => {
  const options: BenchmarkOptions = {
    contract: 'CTESTCONTRACT',
    method: 'transfer',
    iterations: 4,
    concurrency: 2,
    rpcUrl: 'https://soroban-testnet.stellar.org',
  };

  const results: InvocationResult[] = [
    { id: '1', success: true, latencyMs: 100, cpuInstructions: 1_000_000, memoryBytes: 100_000, resourceFeeStroops: 100 },
    { id: '2', success: true, latencyMs: 200, cpuInstructions: 2_000_000, memoryBytes: 200_000, resourceFeeStroops: 200 },
    { id: '3', success: true, latencyMs: 300, cpuInstructions: 3_000_000, memoryBytes: 300_000, resourceFeeStroops: 300 },
    { id: '4', success: false, latencyMs: 50, cpuInstructions: 0, memoryBytes: 0, resourceFeeStroops: 0, error: 'boom' },
  ];

  it('aggregates success/failure counts correctly', () => {
    const report = buildReport(options, results);
    expect(report.successCount).toBe(3);
    expect(report.failureCount).toBe(1);
  });

  it('computes latency stats across all results (including failures)', () => {
    const report = buildReport(options, results);
    expect(report.latency.minMs).toBe(50);
    expect(report.latency.maxMs).toBe(300);
    expect(report.latency.avgMs).toBe(Math.round((100 + 200 + 300 + 50) / 4));
  });

  it('computes CPU/memory/fee stats only from successful invocations', () => {
    const report = buildReport(options, results);
    expect(report.cpuInstructions.min).toBe(1_000_000);
    expect(report.cpuInstructions.max).toBe(3_000_000);
    expect(report.resourceFee.totalStroops).toBe(600);
    expect(report.memoryBytes.avg).toBe(Math.round((100_000 + 200_000 + 300_000) / 3));
  });

  it('handles an all-failure result set without dividing by zero', () => {
    const allFailed: InvocationResult[] = [
      { id: '1', success: false, latencyMs: 10, cpuInstructions: 0, memoryBytes: 0, resourceFeeStroops: 0 },
    ];
    const report = buildReport(options, allFailed);
    expect(report.successCount).toBe(0);
    expect(report.cpuInstructions.avg).toBe(0);
    expect(report.resourceFee.totalStroops).toBe(0);
  });
});

describe('formatMarkdownSummary', () => {
  it('includes the contract, method, and percentile table', () => {
    const options: BenchmarkOptions = {
      contract: 'CTESTCONTRACT',
      method: 'transfer',
      iterations: 1,
      concurrency: 1,
      rpcUrl: 'https://soroban-testnet.stellar.org',
    };
    const report = buildReport(options, [
      { id: '1', success: true, latencyMs: 100, cpuInstructions: 1_000_000, memoryBytes: 100_000, resourceFeeStroops: 100 },
    ]);

    const markdown = formatMarkdownSummary(report);
    expect(markdown).toContain('# Gas Benchmark Report');
    expect(markdown).toContain('CTESTCONTRACT');
    expect(markdown).toContain('transfer');
    expect(markdown).toContain('| Metric | Avg | Min | Max | p50 | p90 | p99 |');
    expect(markdown).toContain('Resource fee');
  });
});

describe('report file export', () => {
  const options: BenchmarkOptions = {
    contract: 'CTESTCONTRACT',
    method: 'transfer',
    iterations: 1,
    concurrency: 1,
    rpcUrl: 'https://soroban-testnet.stellar.org',
  };
  const report = buildReport(options, [
    { id: '1', success: true, latencyMs: 100, cpuInstructions: 1_000_000, memoryBytes: 100_000, resourceFeeStroops: 100 },
  ]);

  it('writes a JSON report file to disk', () => {
    const outPath = path.join(__dirname, '../temp_test_output/report.json');
    writeReportToJson(report, outPath);

    expect(fs.existsSync(outPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(content.contract).toBe('CTESTCONTRACT');

    fs.rmSync(path.dirname(outPath), { recursive: true, force: true });
  });

  it('writes a companion Markdown summary alongside the JSON report', () => {
    const outPath = path.join(__dirname, '../temp_test_output/report.json');
    const mdPath = writeMarkdownSummary(report, outPath);

    expect(mdPath.endsWith('report.md')).toBe(true);
    expect(fs.existsSync(mdPath)).toBe(true);
    const content = fs.readFileSync(mdPath, 'utf-8');
    expect(content).toContain('# Gas Benchmark Report');

    fs.rmSync(path.dirname(outPath), { recursive: true, force: true });
  });
});
