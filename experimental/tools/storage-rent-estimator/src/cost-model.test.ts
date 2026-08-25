import { describe, it, expect } from 'vitest';
import { computeExtensionCost, buildStorageAnalysisReport, DEFAULT_RENT_PARAMS, stroopsToLumens } from './cost-model';
import type { NetworkRentParams, StorageEntry } from './types';

const testParams: NetworkRentParams = {
  ledgersPerDay: 100,
  feePerByteLedgerPersistent: 0.01,
  feePerByteLedgerTemporary: 0,
  baseWriteFeeStroops: 5,
  stroopsPerLumen: 10,
};

describe('computeExtensionCost', () => {
  it('computes rent-per-ledger and extension cost for a persistent entry', () => {
    const entry: StorageEntry = { key: 'balance', durability: 'persistent', sizeBytes: 100 };
    const result = computeExtensionCost(entry, 10, testParams);

    expect(result.rentPerLedgerStroops).toBe(1); // 100 bytes * 0.01
    expect(result.extensionCostStroops).toBe(1 * 10 + 5); // rent*ttl + base fee
  });

  it('charges zero rent-per-ledger for temporary entries under default temp fee', () => {
    const entry: StorageEntry = { key: 'session', durability: 'temporary', sizeBytes: 100 };
    const result = computeExtensionCost(entry, 10, testParams);

    expect(result.rentPerLedgerStroops).toBe(0);
    expect(result.extensionCostStroops).toBe(5); // just the base write fee
  });

  it('clamps a negative targetTtlLedgers to 0', () => {
    const entry: StorageEntry = { key: 'k', durability: 'persistent', sizeBytes: 100 };
    const result = computeExtensionCost(entry, -5, testParams);

    expect(result.targetTtlLedgers).toBe(0);
    expect(result.extensionCostStroops).toBe(5); // only base fee, no ttl-based rent
  });

  it('normalizes a negative entry size to 0 before costing', () => {
    const entry: StorageEntry = { key: 'k', durability: 'persistent', sizeBytes: -100 };
    const result = computeExtensionCost(entry, 10, testParams);

    expect(result.sizeBytes).toBe(0);
    expect(result.rentPerLedgerStroops).toBe(0);
  });
});

describe('buildStorageAnalysisReport', () => {
  it('handles an empty contract (no storage entries) gracefully', () => {
    const report = buildStorageAnalysisReport('CONTRACT_EMPTY', [], 1000, testParams);

    expect(report.entries).toEqual([]);
    expect(report.entryCounts).toEqual({ instance: 0, persistent: 0, temporary: 0 });
    expect(report.totalExtensionCostStroops).toBe(0);
    expect(report.projectedMonthlyRentStroops).toBe(0);
    expect(report.projectedAnnualRentStroops).toBe(0);
  });

  it('aggregates counts, sizes, and costs across mixed durability entries', () => {
    const entries: StorageEntry[] = [
      { key: 'admin', durability: 'instance', sizeBytes: 40 },
      { key: 'balance:alice', durability: 'persistent', sizeBytes: 100 },
      { key: 'balance:bob', durability: 'persistent', sizeBytes: 100 },
      { key: 'nonce:alice', durability: 'temporary', sizeBytes: 20 },
    ];

    const report = buildStorageAnalysisReport('CONTRACT_X', entries, 100, testParams);

    expect(report.entryCounts).toEqual({ instance: 1, persistent: 2, temporary: 1 });
    expect(report.totalSizeBytes).toEqual({ instance: 40, persistent: 200, temporary: 20 });
    expect(report.entries).toHaveLength(4);

    // billable rent/ledger = (40*0.01) + (100*0.01) + (100*0.01) = 2.4 (temporary excluded)
    const expectedMonthly = 2.4 * testParams.ledgersPerDay * 30;
    expect(report.projectedMonthlyRentStroops).toBeCloseTo(expectedMonthly, 5);
  });

  it('excludes temporary entries from monthly/annual rent projections', () => {
    const entries: StorageEntry[] = [{ key: 'session', durability: 'temporary', sizeBytes: 1000 }];
    const report = buildStorageAnalysisReport('CONTRACT_TEMP', entries, 100, testParams);

    expect(report.projectedMonthlyRentStroops).toBe(0);
    expect(report.projectedAnnualRentStroops).toBe(0);
    // but the one-time extension cost (base write fee) is still counted
    expect(report.totalExtensionCostStroops).toBeGreaterThan(0);
  });

  it('converts totals to lumens using stroopsPerLumen', () => {
    const entries: StorageEntry[] = [{ key: 'k', durability: 'persistent', sizeBytes: 100 }];
    const report = buildStorageAnalysisReport('CONTRACT_Y', entries, 10, testParams);

    expect(report.totalExtensionCostLumens).toBeCloseTo(
      report.totalExtensionCostStroops / testParams.stroopsPerLumen,
      10
    );
  });

  it('uses DEFAULT_RENT_PARAMS when no params argument is provided', () => {
    const entries: StorageEntry[] = [{ key: 'k', durability: 'persistent', sizeBytes: 100 }];
    const report = buildStorageAnalysisReport('CONTRACT_Z', entries, 10);

    expect(report.projectedAnnualRentStroops).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_RENT_PARAMS.feePerByteLedgerTemporary).toBe(0);
  });
});

describe('stroopsToLumens', () => {
  it('divides by stroopsPerLumen', () => {
    expect(stroopsToLumens(100, testParams)).toBe(10);
  });

  it('uses default params when none given', () => {
    expect(stroopsToLumens(DEFAULT_RENT_PARAMS.stroopsPerLumen)).toBe(1);
  });
});
