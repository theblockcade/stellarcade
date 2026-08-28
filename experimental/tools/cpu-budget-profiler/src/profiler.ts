import type { rpc } from '@stellar/stellar-sdk';
import { NETWORK_LIMITS } from './types';
import type { BudgetLevel, BudgetUtilization, ProfileMetrics } from './types';

/**
 * Extract CPU instruction and memory byte counts from a successful
 * simulation response's `cost` field. The RPC reports both as decimal
 * strings (arbitrary precision on the wire), so they're parsed with
 * `Number()` here — safe in practice since real budgets stay well under
 * `Number.MAX_SAFE_INTEGER`, but callers profiling deliberately pathological
 * transactions should be aware of that ceiling.
 */
export function extractMetrics(cost: rpc.Api.Cost): ProfileMetrics {
  return {
    cpuInstructions: Number(cost.cpuInsns),
    memoryBytes: Number(cost.memBytes),
  };
}

/** Percentage of a network limit consumed, as a plain number (not clamped — can exceed 100). */
export function budgetPercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return (used / limit) * 100;
}

/**
 * Green < 20%, Yellow 20–80%, Red > 80% of budget consumed.
 *
 * Note: the issue spec states "Yellow 20-60%, Red > 80%", which leaves
 * 60-80% undefined. Closing that gap by extending Yellow through 80%
 * (rather than leaving a silent, uncolored band) so every percentage maps
 * to exactly one level.
 */
export function levelForPercent(percent: number): BudgetLevel {
  if (percent > 80) return 'red';
  if (percent >= 20) return 'yellow';
  return 'green';
}

export function computeUtilization(metrics: ProfileMetrics): BudgetUtilization {
  const cpuPercent = budgetPercent(metrics.cpuInstructions, NETWORK_LIMITS.maxCpuInstructions);
  const memoryPercent = budgetPercent(metrics.memoryBytes, NETWORK_LIMITS.maxMemoryBytes);

  return {
    cpuPercent,
    memoryPercent,
    cpuLevel: levelForPercent(cpuPercent),
    memoryLevel: levelForPercent(memoryPercent),
  };
}

export function generateWarnings(utilization: BudgetUtilization): string[] {
  const warnings: string[] = [];

  if (utilization.cpuLevel === 'red') {
    warnings.push(
      `CPU instruction usage is critical: ${utilization.cpuPercent.toFixed(1)}% of the network limit`
    );
  } else if (utilization.cpuLevel === 'yellow') {
    warnings.push(
      `CPU instruction usage is approaching the ceiling: ${utilization.cpuPercent.toFixed(1)}% of the network limit`
    );
  }

  if (utilization.memoryLevel === 'red') {
    warnings.push(
      `Memory usage is critical: ${utilization.memoryPercent.toFixed(1)}% of the network limit`
    );
  } else if (utilization.memoryLevel === 'yellow') {
    warnings.push(
      `Memory usage is approaching the ceiling: ${utilization.memoryPercent.toFixed(1)}% of the network limit`
    );
  }

  return warnings;
}
