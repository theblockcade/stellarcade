export type DurabilityType = 'instance' | 'persistent' | 'temporary';

export interface StateEntryRaw {
  key: any;
  value: any;
  durability: DurabilityType;
  lastModifiedLedger?: number;
}

export interface DecodedStateEntry {
  key: string;
  keyType: string;
  value: any;
  valueType: string;
  durability: DurabilityType;
  lastModifiedLedger?: number;
}

export function detectScValType(val: any): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return 'bool';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'bigint') return 'i128/u128';
  if (typeof val === 'string') {
    if (val.startsWith('C') && val.length === 56) return 'address';
    if (val.startsWith('G') && val.length === 56) return 'address';
    return 'string';
  }
  if (Array.isArray(val)) return 'vec';
  if (typeof val === 'object') {
    if (val.type === 'symbol') return 'symbol';
    if (val.type === 'address') return 'address';
    if (val._type) return val._type;
    return 'map/struct';
  }
  return 'unknown';
}

export function decodeScVal(scVal: any): { decoded: any; typeName: string } {
  if (scVal === null || scVal === undefined) {
    return { decoded: null, typeName: 'null' };
  }

  if (typeof scVal === 'string' || typeof scVal === 'number' || typeof scVal === 'boolean' || typeof scVal === 'bigint') {
    return { decoded: scVal, typeName: detectScValType(scVal) };
  }

  if (Array.isArray(scVal)) {
    const decodedItems = scVal.map((item) => decodeScVal(item).decoded);
    return { decoded: decodedItems, typeName: 'vec' };
  }

  if (typeof scVal === 'object') {
    if (scVal.symbol) return { decoded: scVal.symbol, typeName: 'symbol' };
    if (scVal.address) return { decoded: scVal.address, typeName: 'address' };
    if (scVal.str) return { decoded: scVal.str, typeName: 'string' };
    if (scVal.u32 !== undefined) return { decoded: scVal.u32, typeName: 'u32' };
    if (scVal.i32 !== undefined) return { decoded: scVal.i32, typeName: 'i32' };
    if (scVal.u64 !== undefined) return { decoded: String(scVal.u64), typeName: 'u64' };
    if (scVal.i64 !== undefined) return { decoded: String(scVal.i64), typeName: 'i64' };
    if (scVal.bytes) return { decoded: scVal.bytes, typeName: 'bytes' };

    // Generic key-value map or struct
    const decodedObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(scVal)) {
      decodedObj[k] = decodeScVal(v).decoded;
    }
    return { decoded: decodedObj, typeName: 'map/struct' };
  }

  return { decoded: String(scVal), typeName: 'unknown' };
}

export function decodeStateEntry(entry: StateEntryRaw): DecodedStateEntry {
  const { decoded: keyDecoded, typeName: keyType } = decodeScVal(entry.key);
  const { decoded: valueDecoded, typeName: valueType } = decodeScVal(entry.value);

  const keyString = typeof keyDecoded === 'object' ? JSON.stringify(keyDecoded) : String(keyDecoded);

  return {
    key: keyString,
    keyType,
    value: valueDecoded,
    valueType,
    durability: entry.durability,
    lastModifiedLedger: entry.lastModifiedLedger
  };
}
