/**
 * Shared types for the Soroban contract gas/CPU budget profiler.
 *
 * IMPORTANT: All metrics produced by this tool are SIMULATED / ESTIMATED.
 * See README.md for a full explanation of the estimation approach — this
 * tool does not execute contracts on a real Soroban host.
 */

/** Ledger-wide resource limits used as the denominator for percentages. */
export interface LedgerBudget {
  /** Maximum CPU instructions allowed per transaction (network limit). */
  maxCpuInstructions: number;
  /** Maximum memory bytes allowed per transaction (network limit). */
  maxMemoryBytes: number;
  /** Maximum number of storage read/write footprint entries allowed. */
  maxStorageEntries: number;
}

/** The estimated resource consumption for a single contract invocation. */
export interface InvocationMetrics {
  cpuInstructions: number;
  memoryBytes: number;
  storageReads: number;
  storageWrites: number;
}

/** Full profiling result for one function invocation. */
export interface ProfileResult {
  wasmPath?: string;
  wasmSizeBytes: number;
  fnName: string;
  args: unknown[];
  metrics: InvocationMetrics;
  budget: LedgerBudget;
  /** Percentage (0-100+) of the CPU instruction budget consumed. */
  cpuPct: number;
  /** Percentage (0-100+) of the memory budget consumed. */
  memPct: number;
  /** Percentage (0-100+) of the storage footprint budget consumed. */
  storagePct: number;
  /** True if cpuPct exceeded the configured warning threshold. */
  exceededThreshold: boolean;
}

/**
 * Pluggable estimator interface. The default implementation
 * (`staticWasmEstimator` in profiler.ts) performs a simple static analysis
 * of the WASM binary. This interface exists so a real soroban-cli / host
 * invocation based estimator can be swapped in later without touching the
 * CLI or reporting code.
 */
export type MetricsEstimator = (
  wasmBuffer: Buffer,
  fnName: string,
  args: unknown[]
) => InvocationMetrics;

export interface CliOptions {
  wasmPath: string;
  fnName: string;
  args: unknown[];
  maxCpuPct: number;
  json: boolean;
}
