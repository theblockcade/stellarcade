import { describe, it, expect } from 'vitest';
import { isStateMutating, hasRequireAuthCall, checkFunction, checkAll } from './rules';
import type { FunctionInfo } from './types';

function fn(overrides: Partial<FunctionInfo> = {}): FunctionInfo {
  return {
    name: 'withdraw',
    filePath: 'lib.rs',
    line: 10,
    addressParams: ['caller'],
    body: '',
    bodyStartLine: 10,
    ...overrides,
  };
}

describe('isStateMutating', () => {
  it('detects instance storage set', () => {
    expect(isStateMutating('env.storage().instance().set(&k, &v);')).toBe(true);
  });

  it('detects persistent storage remove', () => {
    expect(isStateMutating('env.storage().persistent().remove(&k);')).toBe(true);
  });

  it('detects temporary storage update', () => {
    expect(isStateMutating('env.storage().temporary().update(&k, &f);')).toBe(true);
  });

  it('returns false for a read-only body', () => {
    expect(isStateMutating('env.storage().instance().get(&k).unwrap_or(0)')).toBe(false);
  });
});

describe('hasRequireAuthCall', () => {
  it('detects require_auth on the given parameter name', () => {
    expect(hasRequireAuthCall('caller.require_auth();', 'caller')).toBe(true);
  });

  it('detects require_auth_for_args as an equivalent check', () => {
    expect(hasRequireAuthCall('caller.require_auth_for_args(args);', 'caller')).toBe(true);
  });

  it('does not match a different variable name containing the parameter as a substring', () => {
    expect(hasRequireAuthCall('other_caller.require_auth();', 'caller')).toBe(false);
  });

  it('returns false when there is no require_auth call at all', () => {
    expect(hasRequireAuthCall('env.storage().instance().set(&k, &v);', 'caller')).toBe(false);
  });
});

describe('checkFunction', () => {
  it('flags a mutating function with an unauthorized Address parameter (vulnerable)', () => {
    const f = fn({
      body: 'env.storage().instance().set(&DataKey::Balance(caller.clone()), &amount);',
    });
    const violations = checkFunction(f);
    expect(violations).toHaveLength(1);
    expect(violations[0].functionName).toBe('withdraw');
    expect(violations[0].message).toContain('caller.require_auth()');
  });

  it('passes a mutating function that calls require_auth (secure)', () => {
    const f = fn({
      body: 'caller.require_auth(); env.storage().instance().set(&DataKey::Balance, &amount);',
    });
    expect(checkFunction(f)).toEqual([]);
  });

  it('ignores read-only accessor functions entirely, even with an Address param', () => {
    const f = fn({ body: 'env.storage().instance().get(&DataKey::Balance(caller)).unwrap_or(0)' });
    expect(checkFunction(f)).toEqual([]);
  });

  it('ignores functions with no Address parameter', () => {
    const f = fn({
      addressParams: [],
      body: 'env.storage().instance().set(&DataKey::Counter, &1);',
    });
    expect(checkFunction(f)).toEqual([]);
  });

  it('flags each unauthorized Address parameter independently on a multi-address function', () => {
    const f = fn({
      addressParams: ['from', 'to'],
      body: 'from.require_auth(); env.storage().persistent().set(&k, &v);',
    });
    const violations = checkFunction(f);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain("'to.require_auth()'");
  });

  it('produces exact line numbers and remediation text for CI-actionable output', () => {
    const f = fn({ line: 42, body: 'env.storage().instance().set(&k, &v);' });
    const violations = checkFunction(f);
    expect(violations[0].line).toBe(42);
    expect(violations[0].remediation).toContain('require_auth');
  });
});

describe('checkAll', () => {
  it('aggregates violations across multiple functions', () => {
    const secure = fn({
      name: 'secure_fn',
      body: 'caller.require_auth(); env.storage().instance().set(&k, &v);',
    });
    const vulnerable = fn({
      name: 'vulnerable_fn',
      body: 'env.storage().instance().set(&k, &v);',
    });
    const violations = checkAll([secure, vulnerable]);
    expect(violations).toHaveLength(1);
    expect(violations[0].functionName).toBe('vulnerable_fn');
  });

  it('returns an empty array when given no functions', () => {
    expect(checkAll([])).toEqual([]);
  });
});
