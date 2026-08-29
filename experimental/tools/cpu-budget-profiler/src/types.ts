/** Network-wide resource ceilings a single transaction's footprint is measured against. */
export const NETWORK_LIMITS = {
  /** Max CPU instructions per transaction (Soroban mainnet/testnet ceiling). */
  maxCpuInstructions: 100_000_000,
  /** Max memory bytes per transaction. */
  maxMemoryBytes: 41_943_040, // 40 MiB
} as const;

export type BudgetLevel = 'green' | 'yellow' | 'red';

export interface ProfileMetrics {
  cpuInstructions: number;
  memoryBytes: number;
}

export interface BudgetUtilization {
  cpuPercent: number;
  memoryPercent: number;
  cpuLevel: BudgetLevel;
  memoryLevel: BudgetLevel;
}

export interface ProfileResult {
  contractId: string;
  method: string;
  metrics: ProfileMetrics;
  utilization: BudgetUtilization;
  warnings: string[];
}

export interface ProfilerConfig {
  contractId: string;
  method: string;
  args: unknown[];
  rpcUrl: string;
  sourceAccount?: string;
}
