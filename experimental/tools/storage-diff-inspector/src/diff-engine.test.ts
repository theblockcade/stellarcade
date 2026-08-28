import { describe, it, expect } from 'vitest';
import { decodeScVal, diffStorageEntries, stringifyKey, StorageEntryRaw } from './diff-engine';

describe('decodeScVal', () => {
  it('decodes basic primitives', () => {
    expect(decodeScVal('hello').typeName).toBe('string');
    expect(decodeScVal(42).typeName).toBe('number');
    expect(decodeScVal({ symbol: 'GAME_TOKEN' }).decoded).toBe('GAME_TOKEN');
    expect(decodeScVal({ u64: 1000000 }).decoded).toBe('1000000');
  });

  it('detects a Stellar address by prefix and length', () => {
    expect(decodeScVal('CBVNIITX42KQA3MKNUBKG4YIK4FCASZQWKWGHY3YYMM4ANGZ6MOZI2EC').typeName).toBe(
      'address',
    );
  });
});

describe('stringifyKey', () => {
  it('produces a stable string for a symbol key', () => {
    expect(stringifyKey({ symbol: 'TotalPool' })).toBe('TotalPool');
  });

  it('produces a stable string for a map/struct key', () => {
    const key = { address: 'GABC', slot: 1 };
    expect(stringifyKey(key)).toBe(stringifyKey({ ...key }));
  });
});

describe('diffStorageEntries', () => {
  it('detects an added entry', () => {
    const before: StorageEntryRaw[] = [];
    const after: StorageEntryRaw[] = [
      { key: { symbol: 'NewFlag' }, value: { u32: 1 }, durability: 'instance' },
    ];

    const result = diffStorageEntries(before, after);
    expect(result.hasChanges).toBe(true);
    expect(result.addedCount).toBe(1);
    expect(result.entries[0].kind).toBe('added');
    expect(result.entries[0].after).toBe(1);
  });

  it('detects a removed entry', () => {
    const before: StorageEntryRaw[] = [
      { key: { symbol: 'OldFlag' }, value: { u32: 1 }, durability: 'instance' },
    ];
    const after: StorageEntryRaw[] = [];

    const result = diffStorageEntries(before, after);
    expect(result.removedCount).toBe(1);
    expect(result.entries[0].kind).toBe('removed');
    expect(result.entries[0].before).toBe(1);
  });

  it('detects a modified scalar value', () => {
    const before: StorageEntryRaw[] = [
      { key: { symbol: 'TotalPool' }, value: { u64: 1000 }, durability: 'instance' },
    ];
    const after: StorageEntryRaw[] = [
      { key: { symbol: 'TotalPool' }, value: { u64: 2000 }, durability: 'instance' },
    ];

    const result = diffStorageEntries(before, after);
    expect(result.modifiedCount).toBe(1);
    expect(result.entries[0].kind).toBe('modified');
    expect(result.entries[0].before).toBe('1000');
    expect(result.entries[0].after).toBe('2000');
  });

  it('detects a modified struct/map value by deep comparison', () => {
    const before: StorageEntryRaw[] = [
      {
        key: { address: 'GABC' },
        value: { balance: 100, rank: 'Silver' },
        durability: 'persistent',
      },
    ];
    const after: StorageEntryRaw[] = [
      {
        key: { address: 'GABC' },
        value: { balance: 150, rank: 'Silver' },
        durability: 'persistent',
      },
    ];

    const result = diffStorageEntries(before, after);
    expect(result.modifiedCount).toBe(1);
  });

  it('does not report an unchanged struct/map value as modified', () => {
    const entry: StorageEntryRaw = {
      key: { address: 'GABC' },
      value: { balance: 100, rank: 'Silver' },
      durability: 'persistent',
    };

    const result = diffStorageEntries([entry], [{ ...entry, value: { ...entry.value } }]);
    expect(result.hasChanges).toBe(false);
  });

  it('reports "no changes" for identical snapshots', () => {
    const entries: StorageEntryRaw[] = [
      { key: 'Admin', value: 'GABC', durability: 'instance' },
      { key: { symbol: 'Count' }, value: { u32: 5 }, durability: 'instance' },
    ];

    const result = diffStorageEntries(entries, entries.map((e) => ({ ...e })));
    expect(result.hasChanges).toBe(false);
    expect(result.entries).toHaveLength(0);
  });

  it('handles a mix of added, removed, and modified entries in one diff', () => {
    const before: StorageEntryRaw[] = [
      { key: { symbol: 'A' }, value: { u32: 1 }, durability: 'instance' },
      { key: { symbol: 'B' }, value: { u32: 2 }, durability: 'instance' },
    ];
    const after: StorageEntryRaw[] = [
      { key: { symbol: 'A' }, value: { u32: 1 }, durability: 'instance' }, // unchanged
      { key: { symbol: 'B' }, value: { u32: 99 }, durability: 'instance' }, // modified
      { key: { symbol: 'C' }, value: { u32: 3 }, durability: 'instance' }, // added
    ];

    const result = diffStorageEntries(before, after);
    expect(result.addedCount).toBe(1);
    expect(result.modifiedCount).toBe(1);
    expect(result.removedCount).toBe(0);
    expect(result.entries.map((e) => e.key).sort()).toEqual(['B', 'C']);
  });

  it('orders entries: added, then modified, then removed, alphabetically within each group', () => {
    const before: StorageEntryRaw[] = [
      { key: { symbol: 'Zeta' }, value: { u32: 1 }, durability: 'instance' },
      { key: { symbol: 'Mod' }, value: { u32: 1 }, durability: 'instance' },
    ];
    const after: StorageEntryRaw[] = [
      { key: { symbol: 'Mod' }, value: { u32: 2 }, durability: 'instance' },
      { key: { symbol: 'Alpha' }, value: { u32: 1 }, durability: 'instance' },
    ];

    const result = diffStorageEntries(before, after);
    expect(result.entries.map((e) => `${e.kind}:${e.key}`)).toEqual([
      'added:Alpha',
      'modified:Mod',
      'removed:Zeta',
    ]);
  });
});
