import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { lintDirectory } from './index';

const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

describe('lintDirectory (integration)', () => {
  it('flags the vulnerable mock contract for its missing require_auth() check', () => {
    const result = lintDirectory(path.join(FIXTURES_DIR, 'vulnerable-contract'));

    expect(result.filesScanned).toBe(1);
    expect(result.functionsScanned).toBe(2);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].functionName).toBe('withdraw_all');
    expect(result.violations[0].message).toContain('caller.require_auth()');
  });

  it('passes the secure mock contract with zero violations', () => {
    const result = lintDirectory(path.join(FIXTURES_DIR, 'secure-contract'));

    expect(result.filesScanned).toBe(1);
    expect(result.functionsScanned).toBe(2);
    expect(result.violations).toEqual([]);
  });

  it('scans the whole fixtures tree and only reports the vulnerable contract', () => {
    const result = lintDirectory(FIXTURES_DIR);

    expect(result.filesScanned).toBe(2);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].filePath).toContain('vulnerable-contract');
  });
});
