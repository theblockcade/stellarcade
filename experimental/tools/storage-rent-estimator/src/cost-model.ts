import type {
  EntryCostBreakdown,
  NetworkRentParams,
  StorageAnalysisReport,
  StorageEntry,
} from './types';
import { groupEntriesByDurability, normalizeStorageEntry } from './analyzer';

/**
 * Default network rent parameters, approximating current Soroban mainnet
 * config settings (`ConfigSettingContractLedgerCostV0` /
 * `StateExpirationSettings`, see Soroban Protocol docs on state
 * archival/rent). These are intentionally exposed as overridable
 * constants rather than hardcoded, since real fee constants should be
 * fetched from `getLedgerEntries`/network config for a production tool.
 *
 * NOTE: Soroban does not charge ongoing rent for Temporary entries beyond
 * their initial TTL (they simply expire and are not archived), so the
 * temporary fee rate defaults to 0 and temporary entries are excluded
 * from long-horizon (monthly/annual) rent projections below.
 */
export const DEFAULT_RENT_PARAMS: NetworkRentParams = {
  ledgersPerDay: 17280, // ~5s average ledger close time
  feePerByteLedgerPersistent: 0.0000238, // approximate stroops per byte per ledger
  feePerByteLedgerTemporary: 0,
  baseWriteFeeStroops: 100,
  stroopsPerLumen: 10_000_000,
};

/**
 * Computes the stroop cost of extending a single entry's TTL by
 * `targetTtlLedgers` ledgers, given its durability and size.
 */
export function computeExtensionCost(
  entry: StorageEntry,
  targetTtlLedgers: number,
  params: NetworkRentParams
): EntryCostBreakdown {
  const normalized = normalizeStorageEntry(entry);
  const ttlLedgers = Number.isFinite(targetTtlLedgers) && targetTtlLedgers > 0 ? targetTtlLedgers : 0;

  const feePerByteLedger =
    normalized.durability === 'temporary'
      ? params.feePerByteLedgerTemporary
      : params.feePerByteLedgerPersistent;

  const rentPerLedgerStroops = normalized.sizeBytes * feePerByteLedger;
  const extensionCostStroops = rentPerLedgerStroops * ttlLedgers + params.baseWriteFeeStroops;

  return {
    key: normalized.key,
    durability: normalized.durability,
    sizeBytes: normalized.sizeBytes,
    rentPerLedgerStroops,
    targetTtlLedgers: ttlLedgers,
    extensionCostStroops,
  };
}

/**
 * Builds the full storage analysis report for a set of entries: per-entry
 * cost breakdown, aggregate counts/sizes by durability, and monthly/annual
 * rent projections. Handles an empty entry list gracefully (all-zero
 * report) per the "handles contracts with empty storage gracefully"
 * acceptance criterion.
 */
export function buildStorageAnalysisReport(
  contractId: string,
  entries: StorageEntry[],
  targetTtlLedgers: number,
  params: NetworkRentParams = DEFAULT_RENT_PARAMS
): StorageAnalysisReport {
  const { counts, totalSizeBytes } = groupEntriesByDurability(entries);

  const breakdown = entries.map((entry) => computeExtensionCost(entry, targetTtlLedgers, params));
  const totalExtensionCostStroops = breakdown.reduce((sum, e) => sum + e.extensionCostStroops, 0);

  // Only persistent + instance entries accrue ongoing archival rent;
  // temporary entries expire outright rather than being billed long-term.
  const billableRentPerLedger = breakdown
    .filter((e) => e.durability !== 'temporary')
    .reduce((sum, e) => sum + e.rentPerLedgerStroops, 0);

  const projectedMonthlyRentStroops = billableRentPerLedger * params.ledgersPerDay * 30;
  const projectedAnnualRentStroops = billableRentPerLedger * params.ledgersPerDay * 365;

  return {
    contractId,
    targetTtlLedgers,
    entryCounts: counts,
    totalSizeBytes,
    entries: breakdown,
    totalExtensionCostStroops,
    totalExtensionCostLumens: totalExtensionCostStroops / params.stroopsPerLumen,
    projectedMonthlyRentStroops,
    projectedAnnualRentStroops,
    projectedMonthlyRentLumens: projectedMonthlyRentStroops / params.stroopsPerLumen,
    projectedAnnualRentLumens: projectedAnnualRentStroops / params.stroopsPerLumen,
  };
}

export function stroopsToLumens(stroops: number, params: NetworkRentParams = DEFAULT_RENT_PARAMS): number {
  return stroops / params.stroopsPerLumen;
}
