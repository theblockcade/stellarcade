import type { StorageDurability, StorageEntry } from './types';

/**
 * Minimal XDR-shaped representation used to estimate serialized size
 * without pulling in the full soroban-client XDR codec. Each primitive
 * is approximated by its typical encoded footprint (4-byte-aligned,
 * as XDR requires) rather than exact ScVal encoding, which is sufficient
 * for a footprint *estimate* per the issue's scope.
 */
export type EstimatableValue =
  | { type: 'u32' | 'i32'; value: number }
  | { type: 'u64' | 'i64'; value: number | bigint }
  | { type: 'u128' | 'i128'; value: bigint }
  | { type: 'bool'; value: boolean }
  | { type: 'symbol' | 'string'; value: string }
  | { type: 'bytes'; value: Uint8Array }
  | { type: 'address'; value: string }
  | { type: 'vec'; value: EstimatableValue[] }
  | { type: 'map'; value: Array<[EstimatableValue, EstimatableValue]> };

const XDR_WORD = 4;

function padded(byteLength: number): number {
  return Math.ceil(byteLength / XDR_WORD) * XDR_WORD;
}

/**
 * Estimates the serialized XDR byte size of a single ScVal-like value.
 * This is an approximation (fixed per-type overhead + padded payload)
 * intended for storage footprint estimation, not byte-exact encoding.
 */
export function estimateValueSize(value: EstimatableValue): number {
  switch (value.type) {
    case 'bool':
      return 4; // discriminant only, no payload
    case 'u32':
    case 'i32':
      return 4 + 4; // discriminant + 4-byte word
    case 'u64':
    case 'i64':
      return 4 + 8;
    case 'u128':
    case 'i128':
      return 4 + 16;
    case 'symbol':
    case 'string':
      return 4 + 4 + padded(byteLengthOf(value.value)); // discriminant + length + padded bytes
    case 'bytes':
      return 4 + 4 + padded(value.value.byteLength);
    case 'address':
      // Stellar strkey addresses decode to a 32-byte account/contract id
      // plus a small discriminant/type tag.
      return 4 + 4 + 32;
    case 'vec':
      return 4 + 4 + value.value.reduce((sum, v) => sum + estimateValueSize(v), 0);
    case 'map':
      return (
        4 +
        4 +
        value.value.reduce((sum, [k, v]) => sum + estimateValueSize(k) + estimateValueSize(v), 0)
      );
    default:
      return 0;
  }
}

function byteLengthOf(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Estimates the total serialized size (key + value) of a storage entry
 * given an approximate key size and a value shape.
 */
export function estimateEntrySize(keyByteLength: number, value: EstimatableValue): number {
  return padded(keyByteLength) + estimateValueSize(value);
}

/**
 * Groups storage entries by durability (Instance, Persistent, Temporary)
 * and returns per-durability entry counts and total byte sizes. Handles
 * an empty entry list gracefully by returning all-zero counts.
 */
export function groupEntriesByDurability(entries: StorageEntry[]): {
  counts: Record<StorageDurability, number>;
  totalSizeBytes: Record<StorageDurability, number>;
} {
  const counts: Record<StorageDurability, number> = { instance: 0, persistent: 0, temporary: 0 };
  const totalSizeBytes: Record<StorageDurability, number> = {
    instance: 0,
    persistent: 0,
    temporary: 0,
  };

  for (const entry of entries) {
    counts[entry.durability] += 1;
    totalSizeBytes[entry.durability] += Math.max(0, entry.sizeBytes);
  }

  return { counts, totalSizeBytes };
}

/**
 * Validates and normalizes a raw storage entry, clamping negative or
 * non-finite sizes to 0 so a single malformed entry can't corrupt the
 * aggregate report.
 */
export function normalizeStorageEntry(entry: StorageEntry): StorageEntry {
  const sizeBytes = Number.isFinite(entry.sizeBytes) && entry.sizeBytes > 0 ? entry.sizeBytes : 0;
  return { ...entry, sizeBytes };
}
