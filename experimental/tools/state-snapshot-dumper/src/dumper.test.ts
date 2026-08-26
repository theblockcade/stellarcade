import { describe, it, expect } from 'vitest';
import { decodeScVal, decodeStateEntry, StateEntryRaw } from './decoders';
import {
  exportToCsv,
  exportToJson,
  filterEntriesByDurability,
  processRawEntries,
  escapeCsvField
} from './dumper';

describe('state-snapshot-dumper decoders & dumper', () => {
  it('decodes basic ScVal primitives', () => {
    expect(decodeScVal('hello').typeName).toBe('string');
    expect(decodeScVal(42).typeName).toBe('number');
    expect(decodeScVal({ symbol: 'GAME_TOKEN' }).decoded).toBe('GAME_TOKEN');
    expect(decodeScVal({ address: 'CC2IRAYC3CT5KAV4PZKXKCE45Z3QAJQSJH7P5J3GITJT4T3KZ6634R7K' }).typeName).toBe('address');
    expect(decodeScVal({ u64: 1000000 }).decoded).toBe('1000000');
  });

  it('decodes full state entries with durability', () => {
    const raw: StateEntryRaw = {
      key: { symbol: 'Admin' },
      value: { address: 'CBVNIITX42KQA3MKNUBKG4YIK4FCASZQWKWGHY3YYMM4ANGZ6MOZI2EC' },
      durability: 'instance',
      lastModifiedLedger: 5000
    };

    const decoded = decodeStateEntry(raw);
    expect(decoded.key).toBe('Admin');
    expect(decoded.durability).toBe('instance');
    expect(decoded.lastModifiedLedger).toBe(5000);
    expect(decoded.valueType).toBe('address');
  });

  it('filters state entries by durability', () => {
    const rawEntries: StateEntryRaw[] = [
      { key: 'K1', value: 'V1', durability: 'instance' },
      { key: 'K2', value: 'V2', durability: 'persistent' },
      { key: 'K3', value: 'V3', durability: 'temporary' }
    ];

    const decoded = processRawEntries(rawEntries, 'persistent');
    expect(decoded.length).toBe(1);
    expect(decoded[0].durability).toBe('persistent');

    const all = processRawEntries(rawEntries, 'all');
    expect(all.length).toBe(3);
  });

  it('formats CSV output with headers and field escaping', () => {
    const rawEntries: StateEntryRaw[] = [
      { key: 'Key,With,Commas', value: 'Value "With Quotes"', durability: 'instance', lastModifiedLedger: 100 }
    ];
    const decoded = processRawEntries(rawEntries);
    const csv = exportToCsv(decoded);

    expect(csv).toContain('key,key_type,durability,value_type,value,last_modified_ledger');
    expect(csv).toContain('"Key,With,Commas"');
    expect(csv).toContain('"Value ""With Quotes"""');
  });

  it('formats JSON output cleanly', () => {
    const rawEntries: StateEntryRaw[] = [{ key: 'Score', value: 99, durability: 'persistent' }];
    const decoded = processRawEntries(rawEntries);
    const json = exportToJson(decoded);

    const parsed = JSON.parse(json);
    expect(parsed).toBeInstanceOf(Array);
    expect(parsed[0].key).toBe('Score');
    expect(parsed[0].value).toBe(99);
  });

  it('handles field escaping helper', () => {
    expect(escapeCsvField('normal')).toBe('normal');
    expect(escapeCsvField('hello,world')).toBe('"hello,world"');
    expect(escapeCsvField(null)).toBe('""');
  });
});
