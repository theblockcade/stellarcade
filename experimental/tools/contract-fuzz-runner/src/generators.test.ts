import { describe, it, expect } from 'vitest';
import {
  SeededRandom,
  generateArgs,
  generateCall,
  generateSequence,
  generateValue,
  I128_MAX,
  I128_MIN,
  U128_MAX,
  U32_MAX,
  U64_MAX,
} from './generators';
import type { ContractFunctionSpec } from './types';

describe('SeededRandom', () => {
  it('produces the exact same sequence of values for the same seed', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);

    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());

    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);

    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());

    expect(seqA).not.toEqual(seqB);
  });

  it('handles a seed of 0 without producing NaN or a stuck sequence', () => {
    const rng = new SeededRandom(0);
    const values = Array.from({ length: 10 }, () => rng.next());

    for (const v of values) {
      expect(Number.isNaN(v)).toBe(false);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it('handles a negative seed by coercing to an unsigned 32-bit state', () => {
    const rng = new SeededRandom(-42);
    expect(Number.isNaN(rng.next())).toBe(false);
  });

  it('nextInt stays within the inclusive [min, max] bounds', () => {
    const rng = new SeededRandom(7);
    for (let i = 0; i < 200; i++) {
      const n = rng.nextInt(3, 9);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(9);
    }
  });

  it('nextInt returns the single value when min equals max', () => {
    const rng = new SeededRandom(7);
    expect(rng.nextInt(5, 5)).toBe(5);
  });

  it('pick always returns an element from the given array', () => {
    const rng = new SeededRandom(3);
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it('pick throws on an empty array', () => {
    const rng = new SeededRandom(3);
    expect(() => rng.pick([])).toThrow(/empty/);
  });

  it('chance(0) is always false and chance(1) is always true', () => {
    const rng = new SeededRandom(9);
    for (let i = 0; i < 20; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });
});

describe('generateValue', () => {
  it('generates u32 values that stay within u32 bounds and includes boundary values across many draws', () => {
    const rng = new SeededRandom(1);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const v = generateValue({ name: 'n', type: 'u32' }, rng) as number;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(U32_MAX);
      seen.add(v);
    }
    expect(seen.has(0)).toBe(true);
    expect(seen.has(1)).toBe(true);
    expect(seen.has(U32_MAX)).toBe(true);
  });

  it('generates u64 boundary values including 0 and U64_MAX across many draws', () => {
    const rng = new SeededRandom(2);
    const seen = new Set<bigint>();
    for (let i = 0; i < 500; i++) {
      seen.add(generateValue({ name: 'n', type: 'u64' }, rng) as bigint);
    }
    expect(seen.has(0n)).toBe(true);
    expect(seen.has(U64_MAX)).toBe(true);
  });

  it('generates u128 boundary values including U128_MAX across many draws', () => {
    const rng = new SeededRandom(3);
    const seen = new Set<bigint>();
    for (let i = 0; i < 500; i++) {
      seen.add(generateValue({ name: 'n', type: 'u128' }, rng) as bigint);
    }
    expect(seen.has(U128_MAX)).toBe(true);
  });

  it('generates i128 values including negative boundary values across many draws', () => {
    const rng = new SeededRandom(4);
    const seen = new Set<bigint>();
    for (let i = 0; i < 500; i++) {
      seen.add(generateValue({ name: 'n', type: 'i128' }, rng) as bigint);
    }
    expect(seen.has(I128_MIN)).toBe(true);
    expect(seen.has(I128_MAX)).toBe(true);
    expect(seen.has(-1n)).toBe(true);
  });

  it('generates address-shaped string values', () => {
    const rng = new SeededRandom(5);
    const value = generateValue({ name: 'addr', type: 'address' }, rng);
    expect(typeof value).toBe('string');
    expect(String(value)).toMatch(/^GADDR_/);
  });

  it('generates string values including empty string and a max-length string across many draws', () => {
    const rng = new SeededRandom(6);
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      seen.add(generateValue({ name: 's', type: 'string' }, rng) as string);
    }
    expect(seen.has('')).toBe(true);
    expect([...seen].some((s) => s.length === 256)).toBe(true);
  });

  it('generates vec placeholder descriptors for the vec type', () => {
    const rng = new SeededRandom(7);
    const value = generateValue({ name: 'v', type: 'vec' }, rng);
    expect(typeof value).toBe('string');
  });
});

describe('generateArgs', () => {
  it('generates one argument per declared parameter, keyed by name', () => {
    const spec: ContractFunctionSpec = {
      name: 'deposit',
      params: [
        { name: 'user', type: 'address' },
        { name: 'amount', type: 'u128' },
      ],
    };
    const rng = new SeededRandom(1);
    const args = generateArgs(spec, rng);

    expect(Object.keys(args).sort()).toEqual(['amount', 'user']);
  });

  it('returns an empty object for a function with no parameters', () => {
    const spec: ContractFunctionSpec = { name: 'ping', params: [] };
    const args = generateArgs(spec, new SeededRandom(1));
    expect(args).toEqual({});
  });
});

describe('generateCall', () => {
  it('only ever picks functions from the provided list', () => {
    const functions: ContractFunctionSpec[] = [
      { name: 'deposit', params: [] },
      { name: 'withdraw', params: [] },
    ];
    const rng = new SeededRandom(1);
    for (let i = 0; i < 50; i++) {
      const call = generateCall(functions, rng);
      expect(['deposit', 'withdraw']).toContain(call.functionName);
    }
  });
});

describe('generateSequence', () => {
  it('generates exactly `length` calls', () => {
    const functions: ContractFunctionSpec[] = [{ name: 'noop', params: [] }];
    const sequence = generateSequence(functions, 5, new SeededRandom(1));
    expect(sequence).toHaveLength(5);
  });

  it('returns an empty sequence for length 0', () => {
    const functions: ContractFunctionSpec[] = [{ name: 'noop', params: [] }];
    expect(generateSequence(functions, 0, new SeededRandom(1))).toEqual([]);
  });

  it('is deterministic for a fixed seed', () => {
    const functions: ContractFunctionSpec[] = [
      { name: 'deposit', params: [{ name: 'amount', type: 'u128' }] },
      { name: 'withdraw', params: [{ name: 'amount', type: 'u128' }] },
    ];

    const seqA = generateSequence(functions, 10, new SeededRandom(123));
    const seqB = generateSequence(functions, 10, new SeededRandom(123));

    expect(seqA).toEqual(seqB);
  });
});
