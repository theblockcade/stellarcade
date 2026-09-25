import type {
  CliOptions,
  InvocationMetrics,
  LedgerBudget,
  MetricsEstimator,
  ProfileResult,
} from '../types';

/**
 * Default ledger budget, loosely modeled on Soroban mainnet resource
 * limits as of writing. These are illustrative constants for the
 * simulated profiler, not a live fetch from the network.
 */
export const DEFAULT_LEDGER_BUDGET: LedgerBudget = {
  maxCpuInstructions: 100_000_000,
  maxMemoryBytes: 41_943_040, // 40 MiB
  maxStorageEntries: 200,
};

const WASM_MAGIC = Buffer.from([0x00, 0x61, 0x73, 0x6d]);

/**
 * Very small static WASM parser: walks the section headers of a WASM
 * binary well enough to count the number of "code" bytes and estimate
 * an opcode count. This is NOT a full WASM interpreter/validator — it
 * only needs to produce a deterministic, size-correlated instruction
 * estimate for profiling purposes.
 */
function countCodeSectionBytes(buf: Buffer): number {
  if (buf.length < 8 || !buf.subarray(0, 4).equals(WASM_MAGIC)) {
    // Not a recognizable WASM binary; fall back to treating the whole
    // buffer as "code" for estimation purposes.
    return buf.length;
  }

  let offset = 8; // skip magic + version
  let codeBytes = 0;

  while (offset < buf.length) {
    const sectionId = buf[offset];
    offset += 1;
    if (offset >= buf.length) break;

    const { value: sectionLength, bytesRead } = readVarUint(buf, offset);
    offset += bytesRead;

    if (sectionId === 10 /* code section */) {
      codeBytes += sectionLength;
    }

    offset += sectionLength;
  }

  return codeBytes > 0 ? codeBytes : buf.length;
}

function readVarUint(buf: Buffer, offset: number): { value: number; bytesRead: number } {
  let result = 0;
  let shift = 0;
  let bytesRead = 0;
  let byte: number;

  do {
    byte = buf[offset + bytesRead] ?? 0;
    result |= (byte & 0x7f) << shift;
    shift += 7;
    bytesRead += 1;
  } while ((byte & 0x80) !== 0 && offset + bytesRead < buf.length);

  return { value: result >>> 0, bytesRead };
}

/**
 * Deterministic hash of the function name + JSON-serialized args, used to
 * introduce reproducible per-invocation variance into the estimate without
 * needing a real host execution.
 */
function stableArgSeed(fnName: string, args: unknown[]): number {
  const s = fnName + JSON.stringify(args);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Default estimator: a static analysis of the WASM binary combined with a
 * deterministic function of the invocation arguments. This intentionally
 * does NOT execute the contract — see README.md "Simulated metrics" for
 * why, and how to swap in a real Soroban host-based estimator later.
 */
export const staticWasmEstimator: MetricsEstimator = (wasmBuffer, fnName, args) => {
  const codeBytes = countCodeSectionBytes(wasmBuffer);
  const seed = stableArgSeed(fnName, args);

  // Rough heuristic: each byte of compiled code corresponds to a handful
  // of host instructions when actually executed, scaled by argument
  // complexity (more/larger args => more instructions processed).
  const argComplexity = 1 + args.reduce((acc: number, a) => acc + estimateArgWeight(a), 0);

  const cpuInstructions = Math.round(codeBytes * 12 * argComplexity + (seed % 5000));
  const memoryBytes = Math.round(wasmBuffer.length * 1.5 + argComplexity * 1024 + (seed % 2048));
  const storageReads = 1 + (seed % 5);
  const storageWrites = argComplexity > 1 ? 1 + (seed % 3) : seed % 2;

  return {
    cpuInstructions,
    memoryBytes,
    storageReads,
    storageWrites,
  };
};

function estimateArgWeight(arg: unknown): number {
  if (arg === null || arg === undefined) return 0.1;
  if (typeof arg === 'number' || typeof arg === 'boolean') return 0.2;
  if (typeof arg === 'string') return 0.2 + arg.length * 0.02;
  if (Array.isArray(arg)) return 0.5 + arg.reduce((acc: number, a) => acc + estimateArgWeight(a), 0);
  if (typeof arg === 'object') {
    return 0.5 + Object.values(arg as Record<string, unknown>).reduce(
      (acc: number, v) => acc + estimateArgWeight(v),
      0
    );
  }
  return 0.2;
}

export interface ProfileContractOptions {
  budget?: LedgerBudget;
  maxCpuPct?: number;
  estimator?: MetricsEstimator;
  wasmPath?: string;
}

/**
 * Programmatic API: profile a single Soroban contract function invocation.
 *
 * All returned metrics are simulated/estimated from the WASM binary and
 * the invocation arguments — see README.md for details. The estimator can
 * be overridden via `options.estimator` to plug in a real host-based
 * measurement in the future.
 */
export async function profileContract(
  wasmBuffer: Buffer,
  fnName: string,
  args: unknown[],
  options: ProfileContractOptions = {}
): Promise<ProfileResult> {
  const budget = options.budget ?? DEFAULT_LEDGER_BUDGET;
  const maxCpuPct = options.maxCpuPct ?? 100;
  const estimator = options.estimator ?? staticWasmEstimator;

  const metrics: InvocationMetrics = estimator(wasmBuffer, fnName, args);

  const cpuPct = round2((metrics.cpuInstructions / budget.maxCpuInstructions) * 100);
  const memPct = round2((metrics.memoryBytes / budget.maxMemoryBytes) * 100);
  const storagePct = round2(
    ((metrics.storageReads + metrics.storageWrites) / budget.maxStorageEntries) * 100
  );

  return {
    wasmPath: options.wasmPath,
    wasmSizeBytes: wasmBuffer.length,
    fnName,
    args,
    metrics,
    budget,
    cpuPct,
    memPct,
    storagePct,
    exceededThreshold: cpuPct > maxCpuPct,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Build a ProfileContractOptions object from parsed CLI options. */
export function optionsFromCli(cli: Pick<CliOptions, 'maxCpuPct'>): ProfileContractOptions {
  return { maxCpuPct: cli.maxCpuPct };
}

const BAR_WIDTH = 20;

function colorForPct(pct: number): (s: string) => string {
  if (pct >= 100) return red;
  if (pct >= 75) return yellow;
  return green;
}

function red(s: string): string {
  return `\u001b[31m${s}\u001b[0m`;
}
function yellow(s: string): string {
  return `\u001b[33m${s}\u001b[0m`;
}
function green(s: string): string {
  return `\u001b[32m${s}\u001b[0m`;
}
function bold(s: string): string {
  return `\u001b[1m${s}\u001b[0m`;
}
function dim(s: string): string {
  return `\u001b[2m${s}\u001b[0m`;
}

function bar(pct: number): string {
  const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round((pct / 100) * BAR_WIDTH)));
  const empty = BAR_WIDTH - filled;
  const color = colorForPct(pct);
  return color('#'.repeat(filled)) + dim('.'.repeat(empty));
}

function row(label: string, value: string, pct: number): string {
  const pctStr = `${pct.toFixed(2)}%`.padStart(8);
  const colorFn = colorForPct(pct);
  return `${label.padEnd(18)} ${value.padStart(14)}  [${bar(pct)}] ${colorFn(pctStr)}`;
}

/**
 * Formats a ProfileResult into a human-readable, ANSI-colored terminal
 * table. Kept as a pure string-producing function so it is easy to test
 * without capturing stdout.
 */
export function formatReport(result: ProfileResult): string {
  const lines: string[] = [];
  lines.push(bold(`Contract Gas Profile: ${result.fnName}(${result.args.map((a) => JSON.stringify(a)).join(', ')})`));
  if (result.wasmPath) {
    lines.push(dim(`  wasm: ${result.wasmPath} (${result.wasmSizeBytes} bytes)`));
  }
  lines.push('');
  lines.push(
    row(
      'CPU instructions',
      `${result.metrics.cpuInstructions.toLocaleString()}`,
      result.cpuPct
    )
  );
  lines.push(
    row('Memory bytes', `${result.metrics.memoryBytes.toLocaleString()}`, result.memPct)
  );
  lines.push(
    row(
      'Storage ops',
      `${result.metrics.storageReads}r/${result.metrics.storageWrites}w`,
      result.storagePct
    )
  );
  lines.push('');
  if (result.exceededThreshold) {
    lines.push(red(bold(`WARNING: CPU usage (${result.cpuPct}%) exceeded threshold`)));
  } else {
    lines.push(green('OK: within configured thresholds'));
  }
  return lines.join('\n');
}
