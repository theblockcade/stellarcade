import { describe, it, expect } from 'vitest';
import {
  parseRustFunctions,
  classifyRustType,
  defaultReturnValue,
} from './contract-parser.js';

describe('classifyRustType', () => {
  it('classifies string types', () => {
    expect(classifyRustType('String').kind).toBe('string');
    expect(classifyRustType('&str').kind).toBe('string');
  });

  it('classifies boolean', () => {
    expect(classifyRustType('bool').kind).toBe('boolean');
  });

  it('classifies Address', () => {
    expect(classifyRustType('Address').kind).toBe('address');
  });

  it('classifies Bytes types', () => {
    expect(classifyRustType('Bytes').kind).toBe('bytes');
    expect(classifyRustType('BytesN<32>').kind).toBe('bytes');
  });

  it('classifies number types', () => {
    expect(classifyRustType('u32').kind).toBe('number');
    expect(classifyRustType('i128').kind).toBe('number');
    expect(classifyRustType('u64').kind).toBe('number');
  });

  it('classifies Option', () => {
    expect(classifyRustType('Option<Address>').kind).toBe('option');
  });

  it('classifies Vec', () => {
    expect(classifyRustType('Vec<u8>').kind).toBe('vec');
  });

  it('classifies Map', () => {
    expect(classifyRustType('Map<Address, i128>').kind).toBe('map');
  });

  it('classifies unit tuple', () => {
    expect(classifyRustType('()').kind).toBe('tuple');
  });

  it('classifies named types as struct', () => {
    expect(classifyRustType('MyStruct').kind).toBe('struct');
  });
});

describe('parseRustFunctions', () => {
  it('parses a simple public function', () => {
    const source = `
pub fn transfer(amount: i128) -> bool {
    true
}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(1);
    expect(fns[0].name).toBe('transfer');
    expect(fns[0].args).toHaveLength(1);
    expect(fns[0].args[0].name).toBe('amount');
    expect(fns[0].args[0].ty.raw).toBe('i128');
    expect(fns[0].returnType.raw).toBe('bool');
  });

  it('skips env: &Env first parameter', () => {
    const source = `
pub fn get_balance(env: &Env, account: Address) -> i128 {
    0
}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(1);
    expect(fns[0].args).toHaveLength(1);
    expect(fns[0].args[0].name).toBe('account');
    expect(fns[0].args[0].ty.raw).toBe('Address');
  });

  it('parses multiple arguments', () => {
    const source = `
pub fn swap(token_a: Address, token_b: Address, amount: i128) -> bool {
    true
}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(1);
    expect(fns[0].args).toHaveLength(3);
    expect(fns[0].args[0].name).toBe('token_a');
    expect(fns[0].args[2].name).toBe('amount');
  });

  it('handles no return type (unit)', () => {
    const source = `
pub fn initialize(env: &Env) {
}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(1);
    expect(fns[0].returnType.raw).toBe('()');
    expect(fns[0].returnType.kind).toBe('tuple');
  });

  it('captures doc comments', () => {
    const source = `
/// Transfer tokens between accounts
/// Requires authorization from sender
pub fn transfer(from: Address, to: Address, amount: i128) -> bool {
    true
}
`;
    const fns = parseRustFunctions(source);
    expect(fns[0].docComment).toBe('Transfer tokens between accounts\nRequires authorization from sender');
  });

  it('parses multiple functions', () => {
    const source = `
pub fn get_balance(account: Address) -> i128 {
    0
}

pub fn transfer(to: Address, amount: i128) -> bool {
    true
}

pub fn approve(spender: Address, amount: i128) {
}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(3);
    expect(fns[0].name).toBe('get_balance');
    expect(fns[1].name).toBe('transfer');
    expect(fns[2].name).toBe('approve');
  });

  it('handles Map generics in arguments', () => {
    const source = `
pub fn batch_update(updates: Map<Address, i128>) {
}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(1);
    expect(fns[0].args[0].ty.raw).toBe('Map<Address, i128>');
    expect(fns[0].args[0].ty.kind).toBe('map');
  });

  it('handles BytesN<32> return type', () => {
    const source = `
pub fn hash(data: Bytes) -> BytesN<32> {
}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(1);
    expect(fns[0].returnType.raw).toBe('BytesN<32>');
    expect(fns[0].returnType.kind).toBe('bytes');
  });

  it('returns empty array for source with no functions', () => {
    const source = `
// just a comment
mod tests {
    // test module
}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(0);
  });

  it('ignores non-pub functions', () => {
    const source = `
fn internal_helper() -> i128 {
    42
}

pub fn public_api() -> bool {
    true
}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(1);
    expect(fns[0].name).toBe('public_api');
  });

  it('ignores private helper functions', () => {
    const source = `
fn private_helper() {}
`;
    const fns = parseRustFunctions(source);
    expect(fns).toHaveLength(0);
  });
});

describe('defaultReturnValue', () => {
  it('returns string for string kind', () => {
    expect(defaultReturnValue({ raw: 'String', kind: 'string' })).toBe('mock-value');
  });

  it('returns 0 for number kind', () => {
    expect(defaultReturnValue({ raw: 'i128', kind: 'number' })).toBe(0);
  });

  it('returns false for boolean kind', () => {
    expect(defaultReturnValue({ raw: 'bool', kind: 'boolean' })).toBe(false);
  });

  it('returns null for option kind', () => {
    expect(defaultReturnValue({ raw: 'Option<Address>', kind: 'option' })).toBeNull();
  });

  it('returns empty array for vec kind', () => {
    expect(defaultReturnValue({ raw: 'Vec<u8>', kind: 'vec' })).toEqual([]);
  });

  it('returns empty object for map kind', () => {
    expect(defaultReturnValue({ raw: 'Map<Address, i128>', kind: 'map' })).toEqual({});
  });

  it('returns hex string for bytes kind', () => {
    const val = defaultReturnValue({ raw: 'BytesN<32>', kind: 'bytes' }) as string;
    expect(val).toMatch(/^0x/);
  });
});
