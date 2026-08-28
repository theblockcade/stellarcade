import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { CliUsageError, loadEntriesFromFile, resolveSnapshotPair, demoSnapshotPair } from './cli';

const tmpFiles: string[] = [];

function writeTempJson(content: unknown): string {
  const filePath = path.join(os.tmpdir(), `storage-diff-inspector-test-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content));
  tmpFiles.push(filePath);
  return filePath;
}

afterEach(() => {
  for (const f of tmpFiles.splice(0)) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

describe('loadEntriesFromFile', () => {
  it('loads and parses a valid snapshot file', () => {
    const filePath = writeTempJson([{ key: 'A', value: 1, durability: 'instance' }]);
    const entries = loadEntriesFromFile(filePath);
    expect(entries).toEqual([{ key: 'A', value: 1, durability: 'instance' }]);
  });

  it('throws CliUsageError for a missing file', () => {
    expect(() => loadEntriesFromFile('/nonexistent/path/does-not-exist.json')).toThrow(CliUsageError);
  });
});

describe('resolveSnapshotPair', () => {
  it('loads both snapshots from --before-file/--after-file', () => {
    const beforeFile = writeTempJson([{ key: 'A', value: 1, durability: 'instance' }]);
    const afterFile = writeTempJson([{ key: 'A', value: 2, durability: 'instance' }]);

    const { before, after } = resolveSnapshotPair({ beforeFile, afterFile });
    expect(before).toEqual([{ key: 'A', value: 1, durability: 'instance' }]);
    expect(after).toEqual([{ key: 'A', value: 2, durability: 'instance' }]);
  });

  it('falls back to the demo dataset for --before-ledger/--after-ledger with a contract id', () => {
    const result = resolveSnapshotPair({
      contractId: 'CABC123',
      beforeLedger: '100',
      afterLedger: '200',
    });
    expect(result).toEqual(demoSnapshotPair());
  });

  it('requires --contract-id alongside --before-ledger/--after-ledger', () => {
    expect(() => resolveSnapshotPair({ beforeLedger: '100', afterLedger: '200' })).toThrow(
      CliUsageError,
    );
  });

  it('requires either a file pair or a ledger pair to be fully specified', () => {
    expect(() => resolveSnapshotPair({})).toThrow(CliUsageError);
    expect(() => resolveSnapshotPair({ beforeFile: 'only-one.json' })).toThrow(CliUsageError);
    expect(() => resolveSnapshotPair({ beforeLedger: '100' })).toThrow(CliUsageError);
  });

  it('prefers the file pair when both a file pair and a ledger pair are given', () => {
    const beforeFile = writeTempJson([{ key: 'FromFile', value: 1, durability: 'instance' }]);
    const afterFile = writeTempJson([{ key: 'FromFile', value: 1, durability: 'instance' }]);

    const { before } = resolveSnapshotPair({
      beforeFile,
      afterFile,
      contractId: 'CABC123',
      beforeLedger: '100',
      afterLedger: '200',
    });
    expect(before).toEqual([{ key: 'FromFile', value: 1, durability: 'instance' }]);
  });
});
