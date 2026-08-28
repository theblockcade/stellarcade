import { describe, it, expect } from 'vitest';
import { rustTypeToTs, buildMockClientSource, buildDefaultConfig } from './ts-mock-builder.js';
import type { RustFunction, RustType } from './types.js';

describe('rustTypeToTs', () => {
  it('converts string', () => {
    expect(rustTypeToTs({ raw: 'String', kind: 'string' })).toBe('string');
  });

  it('converts number', () => {
    expect(rustTypeToTs({ raw: 'i128', kind: 'number' })).toBe('number');
  });

  it('converts boolean', () => {
    expect(rustTypeToTs({ raw: 'bool', kind: 'boolean' })).toBe('boolean');
  });

  it('converts address to string', () => {
    expect(rustTypeToTs({ raw: 'Address', kind: 'address' })).toBe('string');
  });

  it('converts bytes to string', () => {
    expect(rustTypeToTs({ raw: 'BytesN<32>', kind: 'bytes' })).toBe('string');
  });

  it('converts option', () => {
    const result = rustTypeToTs({ raw: 'Option<Address>', kind: 'option' });
    expect(result).toContain('string | null');
  });

  it('converts vec to unknown array', () => {
    expect(rustTypeToTs({ raw: 'Vec<u8>', kind: 'vec' })).toBe('unknown[]');
  });

  it('converts map to Record', () => {
    expect(rustTypeToTs({ raw: 'Map<Address, i128>', kind: 'map' })).toBe('Record<string, unknown>');
  });

  it('converts unknown to unknown', () => {
    expect(rustTypeToTs({ raw: 'SomeCustom', kind: 'unknown' })).toBe('unknown');
  });
});

describe('buildMockClientSource', () => {
  const simpleFn: RustFunction = {
    name: 'transfer',
    args: [
      { name: 'to', ty: { raw: 'Address', kind: 'address' } },
      { name: 'amount', ty: { raw: 'i128', kind: 'number' } },
    ],
    returnType: { raw: 'bool', kind: 'boolean' },
  };

  const noArgFn: RustFunction = {
    name: 'get_balance',
    args: [
      { name: 'account', ty: { raw: 'Address', kind: 'address' } },
    ],
    returnType: { raw: 'i128', kind: 'number' },
  };

  const voidFn: RustFunction = {
    name: 'initialize',
    args: [],
    returnType: { raw: '()', kind: 'tuple' },
  };

  it('generates a valid class with correct name', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [simpleFn],
    });
    expect(source).toContain('export class MockTokenClient');
    expect(source).toContain('export default MockTokenClient');
  });

  it('generates method signatures matching parsed functions', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [simpleFn],
    });
    expect(source).toContain('async transfer(to: string, amount: number): Promise<boolean>');
  });

  it('generates multiple methods', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [simpleFn, noArgFn],
    });
    expect(source).toContain('async transfer(');
    expect(source).toContain('async get_balance(');
  });

  it('includes doc comments when present', () => {
    const fnWithDoc: RustFunction = {
      name: 'approve',
      args: [],
      returnType: { raw: '()', kind: 'tuple' },
      docComment: 'Approve spender',
    };
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [fnWithDoc],
    });
    expect(source).toContain('Approve spender');
  });

  it('generates mockReturnValue method', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [],
    });
    expect(source).toContain('mockReturnValue(method: string, value: unknown)');
  });

  it('generates mockThrow method', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [],
    });
    expect(source).toContain('mockThrow(method: string, symbol: string)');
  });

  it('generates mockSucceedThenThrow method', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [],
    });
    expect(source).toContain('mockSucceedThenThrow(method: string, succeedCount: number, throwSymbol: string)');
  });

  it('generates reset method', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [],
    });
    expect(source).toContain('reset(): void');
  });

  it('generates getCallCount method', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [],
    });
    expect(source).toContain('getCallCount(method: string): number');
  });

  it('includes error simulation code when enabled', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [voidFn],
      includeErrorSimulation: true,
    });
    expect(source).toContain('throwSymbol');
    expect(source).toContain('Simulated contract error');
  });

  it('includes import for types', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [],
    });
    expect(source).toContain("import type { MockClientConfig, MockMethodConfig } from './types.js'");
  });

  it('includes regenerable comment', () => {
    const source = buildMockClientSource({
      contractName: 'Token',
      functions: [],
    });
    expect(source).toContain('regenerable: run mock-client-generator to rebuild');
  });
});

describe('buildDefaultConfig', () => {
  it('creates config entries for all functions', () => {
    const fns: RustFunction[] = [
      {
        name: 'transfer',
        args: [],
        returnType: { raw: 'bool', kind: 'boolean' },
      },
      {
        name: 'get_balance',
        args: [],
        returnType: { raw: 'i128', kind: 'number' },
      },
    ];
    const config = buildDefaultConfig(fns);
    expect(Object.keys(config.methods)).toEqual(['transfer', 'get_balance']);
  });

  it('sets default return values', () => {
    const fns: RustFunction[] = [
      {
        name: 'transfer',
        args: [],
        returnType: { raw: 'bool', kind: 'boolean' },
      },
    ];
    const config = buildDefaultConfig(fns);
    expect(config.methods['transfer'].returnValue).toBe(false);
  });

  it('applies default latency', () => {
    const fns: RustFunction[] = [
      {
        name: 'slow_method',
        args: [],
        returnType: { raw: '()', kind: 'tuple' },
      },
    ];
    const config = buildDefaultConfig(fns, 100);
    expect(config.methods['slow_method'].latencyMs).toBe(100);
  });
});
