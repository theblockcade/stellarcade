export type DurabilityType = 'instance' | 'persistent' | 'temporary';

export interface StorageEntryRaw {
  key: any;
  value: any;
  durability: DurabilityType;
  lastModifiedLedger?: number;
}

/** A simplified, JSON-shaped SCVal decoder — matches the convention used by
 * the sibling state-snapshot-dumper tool rather than a real XDR-binary
 * decoder, since these experimental tools work against JSON snapshot files
 * (or a demo dataset), not live-binary Horizon/RPC responses. */
export function decodeScVal(scVal: any): { decoded: any; typeName: string } {
  if (scVal === null || scVal === undefined) {
    return { decoded: null, typeName: 'null' };
  }

  if (typeof scVal === 'string' || typeof scVal === 'number' || typeof scVal === 'boolean' || typeof scVal === 'bigint') {
    if (typeof scVal === 'string' && (scVal.startsWith('C') || scVal.startsWith('G')) && scVal.length === 56) {
      return { decoded: scVal, typeName: 'address' };
    }
    return { decoded: scVal, typeName: typeof scVal === 'bigint' ? 'i128/u128' : typeof scVal };
  }

  if (Array.isArray(scVal)) {
    return { decoded: scVal.map((item) => decodeScVal(item).decoded), typeName: 'vec' };
  }

  if (typeof scVal === 'object') {
    if (scVal.symbol !== undefined) return { decoded: scVal.symbol, typeName: 'symbol' };
    if (scVal.address !== undefined) return { decoded: scVal.address, typeName: 'address' };
    if (scVal.str !== undefined) return { decoded: scVal.str, typeName: 'string' };
    if (scVal.u32 !== undefined) return { decoded: scVal.u32, typeName: 'u32' };
    if (scVal.i32 !== undefined) return { decoded: scVal.i32, typeName: 'i32' };
    if (scVal.u64 !== undefined) return { decoded: String(scVal.u64), typeName: 'u64' };
    if (scVal.i64 !== undefined) return { decoded: String(scVal.i64), typeName: 'i64' };
    if (scVal.bytes !== undefined) return { decoded: scVal.bytes, typeName: 'bytes' };

    const decodedObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(scVal)) {
      decodedObj[k] = decodeScVal(v).decoded;
    }
    return { decoded: decodedObj, typeName: 'map/struct' };
  }

  return { decoded: String(scVal), typeName: 'unknown' };
}

/** Renders a (possibly object/array) storage key into a stable string so it
 * can be used as a diff map key across two snapshots. */
export function stringifyKey(key: any): string {
  const { decoded } = decodeScVal(key);
  return typeof decoded === 'object' && decoded !== null ? JSON.stringify(decoded) : String(decoded);
}

export type DiffKind = 'added' | 'removed' | 'modified';

export interface StorageDiffEntry {
  key: string;
  keyType: string;
  durability: DurabilityType;
  kind: DiffKind;
  before?: any;
  beforeType?: string;
  after?: any;
  afterType?: string;
}

export interface StorageDiffResult {
  hasChanges: boolean;
  entries: StorageDiffEntry[];
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => deepEqual(a[k], b[k]));
}

/**
 * Computes a key-by-key delta between two storage snapshots. Entries only
 * in `before` are Removed, entries only in `after` are Added, and entries
 * present in both with a different decoded value are Modified.
 */
export function diffStorageEntries(
  before: StorageEntryRaw[],
  after: StorageEntryRaw[],
): StorageDiffResult {
  const beforeByKey = new Map<string, StorageEntryRaw>();
  for (const entry of before) {
    beforeByKey.set(stringifyKey(entry.key), entry);
  }

  const afterByKey = new Map<string, StorageEntryRaw>();
  for (const entry of after) {
    afterByKey.set(stringifyKey(entry.key), entry);
  }

  const entries: StorageDiffEntry[] = [];
  const allKeys = new Set([...beforeByKey.keys(), ...afterByKey.keys()]);

  for (const key of allKeys) {
    const beforeEntry = beforeByKey.get(key);
    const afterEntry = afterByKey.get(key);

    if (beforeEntry && !afterEntry) {
      const { decoded, typeName } = decodeScVal(beforeEntry.value);
      entries.push({
        key,
        keyType: decodeScVal(beforeEntry.key).typeName,
        durability: beforeEntry.durability,
        kind: 'removed',
        before: decoded,
        beforeType: typeName,
      });
    } else if (!beforeEntry && afterEntry) {
      const { decoded, typeName } = decodeScVal(afterEntry.value);
      entries.push({
        key,
        keyType: decodeScVal(afterEntry.key).typeName,
        durability: afterEntry.durability,
        kind: 'added',
        after: decoded,
        afterType: typeName,
      });
    } else if (beforeEntry && afterEntry) {
      const beforeDecoded = decodeScVal(beforeEntry.value);
      const afterDecoded = decodeScVal(afterEntry.value);
      if (!deepEqual(beforeDecoded.decoded, afterDecoded.decoded)) {
        entries.push({
          key,
          keyType: decodeScVal(afterEntry.key).typeName,
          durability: afterEntry.durability,
          kind: 'modified',
          before: beforeDecoded.decoded,
          beforeType: beforeDecoded.typeName,
          after: afterDecoded.decoded,
          afterType: afterDecoded.typeName,
        });
      }
    }
  }

  // Stable, readable ordering: added, then modified, then removed, each
  // alphabetically by key.
  const kindOrder: Record<DiffKind, number> = { added: 0, modified: 1, removed: 2 };
  entries.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.key.localeCompare(b.key));

  return {
    hasChanges: entries.length > 0,
    entries,
    addedCount: entries.filter((e) => e.kind === 'added').length,
    removedCount: entries.filter((e) => e.kind === 'removed').length,
    modifiedCount: entries.filter((e) => e.kind === 'modified').length,
  };
}
