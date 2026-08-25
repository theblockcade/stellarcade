export type StorageDurability = 'instance' | 'persistent' | 'temporary';

export interface StorageEntry {
  key: string;
  durability: StorageDurability;
  /** Serialized key+value XDR size in bytes. */
  sizeBytes: number;
  /** Ledger sequence at which this entry's current TTL expires, if known. */
  liveUntilLedgerSeq?: number;
}

export interface NetworkRentParams {
  /** Approximate ledgers produced per day (Stellar targets ~5s close time). */
  ledgersPerDay: number;
  /** Fee, in stroops, charged per (byte * ledger) of extended TTL for persistent/instance entries. */
  feePerByteLedgerPersistent: number;
  /** Fee, in stroops, charged per (byte * ledger) of extended TTL for temporary entries. */
  feePerByteLedgerTemporary: number;
  /** Flat write fee, in stroops, applied per entry write independent of size. */
  baseWriteFeeStroops: number;
  /** Stroops per lumen, for converting projections to XLM. */
  stroopsPerLumen: number;
}

export interface EntryCostBreakdown {
  key: string;
  durability: StorageDurability;
  sizeBytes: number;
  rentPerLedgerStroops: number;
  targetTtlLedgers: number;
  extensionCostStroops: number;
}

export interface StorageAnalysisReport {
  contractId: string;
  targetTtlLedgers: number;
  entryCounts: Record<StorageDurability, number>;
  totalSizeBytes: Record<StorageDurability, number>;
  entries: EntryCostBreakdown[];
  totalExtensionCostStroops: number;
  totalExtensionCostLumens: number;
  projectedMonthlyRentStroops: number;
  projectedAnnualRentStroops: number;
  projectedMonthlyRentLumens: number;
  projectedAnnualRentLumens: number;
}
