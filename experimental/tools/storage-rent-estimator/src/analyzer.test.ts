import { describe, it, expect } from 'vitest';
import {
  estimateValueSize,
  estimateEntrySize,
  groupEntriesByDurability,
  normalizeStorageEntry,
  type EstimatableValue,
} from './analyzer';
import type { StorageEntry } from './types';

describe('estimateValueSize', () => {
  it('sizes a bool as 4 bytes (discriminant only)', () => {
    expect(estimateValueSize({ type: 'bool', value: true })).toBe(4);
  });

  it('sizes a u32 as 8 bytes', () => {
    expect(estimateValueSize({ type: 'u32', value: 42 })).toBe(8);
  });

  it('sizes a u64 as 12 bytes', () => {
    expect(estimateValueSize({ type: 'u64', value: 42 })).toBe(12);
  });

  it('sizes a u128 as 20 bytes', () => {
    expect(estimateValueSize({ type: 'u128', value: 42n })).toBe(20);
  });

  it('sizes an address as a fixed 40 bytes', () => {
    expect(
      estimateValueSize({
        type: 'address',
        value: 'GABCDEFGHJKLMNPQRSTUVWXYZ234567ABCDEFGHJKLMNPQRSTUVWXYZ2',
      })
    ).toBe(40);
  });

  it('pads a short symbol/string to a 4-byte boundary', () => {
    // "hi" -> 2 bytes, padded to 4
    expect(estimateValueSize({ type: 'symbol', value: 'hi' })).toBe(4 + 4 + 4);
  });

  it('does not over-pad a string already aligned to 4 bytes', () => {
    // "test" -> 4 bytes, no extra padding needed
    expect(estimateValueSize({ type: 'string', value: 'test' })).toBe(4 + 4 + 4);
  });

  it('sizes an empty vec as just its overhead', () => {
    expect(estimateValueSize({ type: 'vec', value: [] })).toBe(8);
  });

  it('sizes a vec as overhead plus the sum of its elements', () => {
    const value: EstimatableValue = {
      type: 'vec',
      value: [
        { type: 'u32', value: 1 },
        { type: 'u32', value: 2 },
      ],
    };
    expect(estimateValueSize(value)).toBe(8 + 8 + 8);
  });

  it('sizes an empty map as just its overhead', () => {
    expect(estimateValueSize({ type: 'map', value: [] })).toBe(8);
  });

  it('sizes a map as overhead plus key+value sizes', () => {
    const value: EstimatableValue = {
      type: 'map',
      value: [[{ type: 'u32', value: 1 }, { type: 'bool', value: true }]],
    };
    expect(estimateValueSize(value)).toBe(8 + 8 + 4);
  });

  it('sizes bytes with padding', () => {
    const bytes = new Uint8Array([1, 2, 3]); // 3 bytes -> padded to 4
    expect(estimateValueSize({ type: 'bytes', value: bytes })).toBe(4 + 4 + 4);
  });
});

describe('estimateEntrySize', () => {
  it('combines padded key size and value size', () => {
    // key "id" -> 2 bytes padded to 4; value u32 -> 8 bytes
    const size = estimateEntrySize(2, { type: 'u32', value: 1 });
    expect(size).toBe(4 + 8);
  });
});

describe('groupEntriesByDurability', () => {
  const makeEntry = (overrides: Partial<StorageEntry>): StorageEntry => ({
    key: 'k',
    durability: 'persistent',
    sizeBytes: 10,
    ...overrides,
  });

  it('returns all-zero counts for an empty entry list', () => {
    const { counts, totalSizeBytes } = groupEntriesByDurability([]);
    expect(counts).toEqual({ instance: 0, persistent: 0, temporary: 0 });
    expect(totalSizeBytes).toEqual({ instance: 0, persistent: 0, temporary: 0 });
  });

  it('groups and sums entries by durability', () => {
    const entries = [
      makeEntry({ durability: 'persistent', sizeBytes: 100 }),
      makeEntry({ durability: 'persistent', sizeBytes: 50 }),
      makeEntry({ durability: 'temporary', sizeBytes: 20 }),
      makeEntry({ durability: 'instance', sizeBytes: 5 }),
    ];

    const { counts, totalSizeBytes } = groupEntriesByDurability(entries);

    expect(counts).toEqual({ instance: 1, persistent: 2, temporary: 1 });
    expect(totalSizeBytes).toEqual({ instance: 5, persistent: 150, temporary: 20 });
  });

  it('ignores negative sizes when summing (treats as 0)', () => {
    const entries = [makeEntry({ sizeBytes: -50 })];
    const { totalSizeBytes } = groupEntriesByDurability(entries);
    expect(totalSizeBytes.persistent).toBe(0);
  });
});

describe('normalizeStorageEntry', () => {
  it('clamps a negative size to 0', () => {
    const entry: StorageEntry = { key: 'k', durability: 'instance', sizeBytes: -10 };
    expect(normalizeStorageEntry(entry).sizeBytes).toBe(0);
  });

  it('clamps a NaN size to 0', () => {
    const entry: StorageEntry = { key: 'k', durability: 'instance', sizeBytes: NaN };
    expect(normalizeStorageEntry(entry).sizeBytes).toBe(0);
  });

  it('preserves a valid positive size', () => {
    const entry: StorageEntry = { key: 'k', durability: 'instance', sizeBytes: 42 };
    expect(normalizeStorageEntry(entry).sizeBytes).toBe(42);
  });
});
