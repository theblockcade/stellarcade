import { describe, it, expect } from 'vitest';
import { xdr, nativeToScVal, Address, Keypair } from '@stellar/stellar-sdk';
import { describeScVal, scValTypeName, decodeLedgerEntry } from './xdr-parser';

/** Build a mock ContractData LedgerEntryData for a given key, as the RPC would return it. */
function mockContractDataEntry(key: xdr.ScVal): xdr.LedgerEntryData {
  // The generated .d.ts for ExtensionPoint's constructor/static factories is
  // unreliable across SDK versions (varies between a 0-arg static `0()`, a
  // 1-arg constructor, and other shapes) — constructing via `new` with the
  // discriminant is what the compiled runtime code actually accepts.
  const extensionPointZero = new (xdr.ExtensionPoint as unknown as new (arm: number) => xdr.ExtensionPoint)(0);

  return xdr.LedgerEntryData.contractData(
    new xdr.ContractDataEntry({
      ext: extensionPointZero,
      contract: new Address(Keypair.random().publicKey()).toScAddress(),
      key,
      durability: xdr.ContractDataDurability.persistent(),
      val: xdr.ScVal.scvVoid(),
    })
  );
}

describe('scValTypeName', () => {
  it('maps every scalar SCVal variant to its readable type name', () => {
    expect(scValTypeName(nativeToScVal('hello', { type: 'symbol' }))).toBe('Symbol');
    expect(scValTypeName(nativeToScVal(42, { type: 'u32' }))).toBe('U32');
    expect(scValTypeName(nativeToScVal(42n, { type: 'u64' }))).toBe('U64');
    expect(scValTypeName(nativeToScVal(true))).toBe('Bool');
    expect(scValTypeName(xdr.ScVal.scvVoid())).toBe('Void');
  });

  it('falls back to the raw switch name (minus the scv prefix) for unmapped variants', () => {
    expect(scValTypeName(nativeToScVal(-1, { type: 'i32' }))).toBe('I32');
  });
});

describe('describeScVal', () => {
  const address = Keypair.random().publicKey();

  it('describes a Symbol key', () => {
    const val = nativeToScVal('Admin', { type: 'symbol' });
    expect(describeScVal(val)).toBe('Symbol(Admin)');
  });

  it('describes an Address key', () => {
    const val = new Address(address).toScVal();
    expect(describeScVal(val)).toBe(`Address(${address})`);
  });

  it('describes a nested Map with mixed key/value types', () => {
    const val = nativeToScVal(
      { owner: new Address(address), id: 7n },
      { type: { owner: ['symbol', null], id: ['symbol', 'u64'] } }
    );
    const out = describeScVal(val);
    expect(out).toContain('Map{');
    expect(out).toContain(`Symbol(owner): Address(${address})`);
    expect(out).toContain('Symbol(id): U64(7)');
  });

  it('describes a Vec of scalars', () => {
    const val = nativeToScVal([1n, 2n, 3n], { type: 'u64' });
    expect(describeScVal(val)).toBe('Vec[U64(1), U64(2), U64(3)]');
  });

  it('describes a Bool', () => {
    expect(describeScVal(nativeToScVal(true))).toBe('Bool(true)');
    expect(describeScVal(nativeToScVal(false))).toBe('Bool(false)');
  });

  it('describes Void', () => {
    expect(describeScVal(xdr.ScVal.scvVoid())).toBe('Void');
  });

  it('describes a String', () => {
    const val = nativeToScVal('hello world', { type: 'string' });
    expect(describeScVal(val)).toBe('String("hello world")');
  });
});

describe('decodeLedgerEntry', () => {
  it('decodes a ContractData entry into a StorageEntry with the given durability', () => {
    const key = nativeToScVal('Admin', { type: 'symbol' });
    const entryData = mockContractDataEntry(key);

    const result = decodeLedgerEntry(entryData, 'persistent', 12345);

    expect(result.durability).toBe('persistent');
    expect(result.decodedKey).toBe('Symbol(Admin)');
    expect(result.keyType).toBe('Symbol');
    expect(result.liveUntilLedgerSeq).toBe(12345);
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('throws a clear error for a non-ContractData ledger entry', () => {
    const notContractData = xdr.LedgerEntryData.ttl(
      new xdr.TtlEntry({ keyHash: Buffer.alloc(32), liveUntilLedgerSeq: 1000 })
    );

    expect(() => decodeLedgerEntry(notContractData, 'instance')).toThrow(
      /Expected ContractData/
    );
  });
});
