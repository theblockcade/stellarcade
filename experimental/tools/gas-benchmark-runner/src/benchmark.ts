import * as fs from 'fs';
import * as path from 'path';
import type { BenchmarkOptions, InvocationResult, LatencyPercentiles, BenchmarkReport } from './types.js';

/**
 * Returns the value at the given percentile (0-100) for an ascending-sorted array.
 * Uses the nearest-rank method, matching the convention used elsewhere in the
 * experimental tools workspace (see throughput-latency-tester).
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
 * Arithmetic mean of a set of numbers. Returns 0 for an empty input.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Median (p50 via nearest-rank) of a set of numbers. Returns 0 for an empty input.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 50);
}

/**
 * Computes p50/p90/p99 for a set of numbers in a single pass over a sorted copy.
 */
export function calculatePercentiles(values: number[]): LatencyPercentiles {
  if (values.length === 0) {
    return { p50: 0, p90: 0, p99: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p99: percentile(sorted, 99),
  };
}

function minOf(values: number[]): number {
  return values.length > 0 ? Math.min(...values) : 0;
}

function maxOf(values: number[]): number {
  return values.length > 0 ? Math.max(...values) : 0;
}

/** Simple counting semaphore used to cap invocation concurrency. */
class Semaphore {
  private waiters: (() => void)[] = [];
  private current = 0;

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    if (this.waiters.length > 0) {
      const next = this.waiters.shift()!;
      next();
    } else {
      this.current--;
    }
  }
}

export type SimulateInvocationFn = (
  contract: string,
  method: string,
  id: number
) => Promise<InvocationResult>;

/**
 * Default simulated invocation used when no RPC / simulate function is injected.
 * Mimics a Soroban `simulateTransaction` response: latency, CPU instructions,
 * memory usage, and resource fee, with a small failure rate to exercise error
 * handling paths.
 */
export async function defaultSimulateInvocation(
  contract: string,
  method: string,
  id: number
): Promise<InvocationResult> {
  const latencyMs = 20 + Math.floor(Math.random() * 180);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const success = Math.random() > 0.03;
  const cpuInstructions = success ? 500_000 + Math.floor(Math.random() * 4_500_000) : 0;
  const memoryBytes = success ? 50_000 + Math.floor(Math.random() * 200_000) : 0;
  const resourceFeeStroops = success ? 100 + Math.floor(cpuInstructions / 10_000) : 0;

  return {
    id: `${contract}:${method}:${id}`,
    success,
    latencyMs,
    cpuInstructions,
    memoryBytes,
    resourceFeeStroops,
    error: success ? undefined : 'Simulated invocation failure',
  };
}

/**
 * Runs `iterations` simulated invocations against `options.contract` /
 * `options.method`, bounded by `options.concurrency` in-flight requests at a
 * time, and returns the raw per-invocation results.
 */
export async function runBenchmark(
  options: BenchmarkOptions,
  simulate: SimulateInvocationFn = defaultSimulateInvocation
): Promise<InvocationResult[]> {
  if (options.iterations <= 0) {
    throw new Error('iterations must be a positive integer');
  }
  if (options.concurrency <= 0) {
    throw new Error('concurrency must be a positive integer');
  }

  const semaphore = new Semaphore(options.concurrency);
  const results: InvocationResult[] = new Array(options.iterations);
  const inFlight: Promise<void>[] = [];

  const fireInvocation = async (id: number): Promise<void> => {
    await semaphore.acquire();
    try {
      results[id] = await simulate(options.contract, options.method, id);
    } finally {
      semaphore.release();
    }
  };

  for (let i = 0; i < options.iterations; i++) {
    inFlight.push(fireInvocation(i));
  }

  await Promise.all(inFlight);

  return results;
}

/**
 * Aggregates raw invocation results into a full benchmark report with
 * latency / CPU-instruction / memory / fee statistics.
 */
export function buildReport(
  options: BenchmarkOptions,
  results: InvocationResult[]
): BenchmarkReport {
  const successResults = results.filter((r) => r.success);
  const failureCount = results.length - successResults.length;

  const latencies = results.map((r) => r.latencyMs);
  const cpuValues = successResults.map((r) => r.cpuInstructions);
  const memoryValues = successResults.map((r) => r.memoryBytes);
  const feeValues = successResults.map((r) => r.resourceFeeStroops);

  return {
    contract: options.contract,
    method: options.method,
    iterations: options.iterations,
    concurrency: options.concurrency,
    timestamp: new Date().toISOString(),
    successCount: successResults.length,
    failureCount,
    latency: {
      avgMs: Math.round(mean(latencies)),
      minMs: minOf(latencies),
      maxMs: maxOf(latencies),
      percentiles: calculatePercentiles(latencies),
    },
    cpuInstructions: {
      avg: Math.round(mean(cpuValues)),
      min: minOf(cpuValues),
      max: maxOf(cpuValues),
      percentiles: calculatePercentiles(cpuValues),
    },
    memoryBytes: {
      avg: Math.round(mean(memoryValues)),
      min: minOf(memoryValues),
      max: maxOf(memoryValues),
    },
    resourceFee: {
      avgStroops: Math.round(mean(feeValues)),
      minStroops: minOf(feeValues),
      maxStroops: maxOf(feeValues),
      totalStroops: feeValues.reduce((sum, v) => sum + v, 0),
    },
  };
}

/**
 * Renders a Markdown summary table for a benchmark report, suitable for
 * pasting into a PR description or CI job summary.
 */
export function formatMarkdownSummary(report: BenchmarkReport): string {
  const lines: string[] = [
    `# Gas Benchmark Report`,
    '',
    `- **Contract**: \`${report.contract}\``,
    `- **Method**: \`${report.method}\``,
    `- **Iterations**: ${report.iterations} (concurrency: ${report.concurrency})`,
    `- **Timestamp**: ${report.timestamp}`,
    `- **Success / Failure**: ${report.successCount} / ${report.failureCount}`,
    '',
    '| Metric | Avg | Min | Max | p50 | p90 | p99 |',
    '|---|---|---|---|---|---|---|',
    `| Latency (ms) | ${report.latency.avgMs} | ${report.latency.minMs} | ${report.latency.maxMs} | ${report.latency.percentiles.p50} | ${report.latency.percentiles.p90} | ${report.latency.percentiles.p99} |`,
    `| CPU instructions | ${report.cpuInstructions.avg} | ${report.cpuInstructions.min} | ${report.cpuInstructions.max} | ${report.cpuInstructions.percentiles.p50} | ${report.cpuInstructions.percentiles.p90} | ${report.cpuInstructions.percentiles.p99} |`,
    `| Memory (bytes) | ${report.memoryBytes.avg} | ${report.memoryBytes.min} | ${report.memoryBytes.max} | - | - | - |`,
    '',
    '| Resource fee | Value |',
    '|---|---|',
    `| Avg (stroops) | ${report.resourceFee.avgStroops} |`,
    `| Min (stroops) | ${report.resourceFee.minStroops} |`,
    `| Max (stroops) | ${report.resourceFee.maxStroops} |`,
    `| Total (stroops) | ${report.resourceFee.totalStroops} |`,
    '',
  ];
  return lines.join('\n');
}

/**
 * Writes the JSON benchmark report to disk, creating parent directories as
 * needed.
 */
export function writeReportToJson(report: BenchmarkReport, outputPath: string): void {
  const resolvedPath = path.resolve(outputPath);
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(resolvedPath, JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Writes the Markdown summary table to disk alongside the JSON report,
 * reusing the same base filename with a `.md` extension.
 */
export function writeMarkdownSummary(report: BenchmarkReport, outputPath: string): string {
  const resolvedPath = path.resolve(outputPath);
  const parsed = path.parse(resolvedPath);
  const mdPath = path.join(parsed.dir, `${parsed.name}.md`);

  const dir = path.dirname(mdPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(mdPath, formatMarkdownSummary(report), 'utf-8');
  return mdPath;
}
