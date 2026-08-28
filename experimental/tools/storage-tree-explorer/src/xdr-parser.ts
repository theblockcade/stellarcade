import { xdr, scValToNative, Address } from '@stellar/stellar-sdk';
import type { StorageDurability, StorageEntry } from './types';

/**
 * Decode one parsed `LedgerEntryData` (as returned by the RPC's
 * `getLedgerEntries`, already XDR-decoded by the SDK) into a human-readable
 * {@link StorageEntry}. Handles the three SCVal shapes a Soroban contract
 * data key/value pair can take: scalars (Symbol, U64, Address, ...), Vec,
 * and Map — recursing into Vec/Map so nested structures render legibly
 * instead of as opaque XDR blobs.
 */
export function decodeLedgerEntry(
  entryData: xdr.LedgerEntryData,
  durability: StorageDurability,
  liveUntilLedgerSeq?: number
): StorageEntry {
  if (entryData.switch().name !== 'contractData') {
    throw new Error(`Expected ContractData ledger entry, got ${entryData.switch().name}`);
  }

  const contractData = entryData.contractData();
  const keyVal = contractData.key();
  const decodedKey = describeScVal(keyVal);
  const keyType = scValTypeName(keyVal);
  // Re-encode to measure the on-chain footprint size, since the parsed
  // struct itself carries no byte-length metadata.
  const sizeBytes = entryData.toXDR().length;

  return { durability, decodedKey, keyType, sizeBytes, liveUntilLedgerSeq };
}

/** The SCVal variant name, e.g. `Symbol`, `Vec`, `Map`, `Address`, `U64`. */
export function scValTypeName(val: xdr.ScVal): string {
  const switchName = val.switch().name;
  const map: Record<string, string> = {
    scvSymbol: 'Symbol',
    scvString: 'String',
    scvVec: 'Vec',
    scvMap: 'Map',
    scvAddress: 'Address',
    scvU32: 'U32',
    scvI32: 'I32',
    scvU64: 'U64',
    scvI64: 'I64',
    scvU128: 'U128',
    scvI128: 'I128',
    scvBool: 'Bool',
    scvBytes: 'Bytes',
    scvVoid: 'Void',
  };
  return map[switchName] ?? switchName.replace(/^scv/, '');
}

/**
 * Render an SCVal as a compact human-readable string. Recurses into Vec/Map
 * so a key like `Map{owner: Address(GABC...), id: U64(7)}` is fully legible
 * without needing a separate decode step downstream.
 */
export function describeScVal(val: xdr.ScVal): string {
  const type = scValTypeName(val);

  switch (val.switch().name) {
    case 'scvSymbol':
      return `Symbol(${val.sym().toString()})`;
    case 'scvString':
      return `String("${val.str().toString()}")`;
    case 'scvAddress':
      return `Address(${Address.fromScAddress(val.address()).toString()})`;
    case 'scvVec': {
      const items = (val.vec() ?? []).map(describeScVal).join(', ');
      return `Vec[${items}]`;
    }
    case 'scvMap': {
      const entries = (val.map() ?? [])
        .map((e) => `${describeScVal(e.key())}: ${describeScVal(e.val())}`)
        .join(', ');
      return `Map{${entries}}`;
    }
    case 'scvBool':
      return `Bool(${val.b()})`;
    case 'scvVoid':
      return 'Void';
    default:
      try {
        return `${type}(${scValToNative(val)})`;
      } catch {
        return type;
      }
  }
}
