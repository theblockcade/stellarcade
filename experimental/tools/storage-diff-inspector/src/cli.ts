import fs from 'fs';
import path from 'path';
import { StorageEntryRaw } from './diff-engine';

/** Fallback demo dataset used when no --before-file/--after-file is given
 * and no live Soroban RPC is reachable in this sandbox — mirrors the
 * pattern used by the sibling state-snapshot-dumper tool. Deliberately
 * includes one added, one removed, and one modified entry so `--out`
 * produces a non-trivial example report out of the box. */
export function demoSnapshotPair(): { before: StorageEntryRaw[]; after: StorageEntryRaw[] } {
  const before: StorageEntryRaw[] = [
    { key: 'Admin', value: 'CBVNIITX42KQA3MKNUBKG4YIK4FCASZQWKWGHY3YYMM4ANGZ6MOZI2EC', durability: 'instance', lastModifiedLedger: 120500 },
    { key: { symbol: 'TotalPool' }, value: { u64: 50000000000 }, durability: 'instance', lastModifiedLedger: 120510 },
    { key: { address: 'GBXWW2ZJ6Z4EXAMPLE1' }, value: { balance: 10000, rank: 'Silver' }, durability: 'persistent', lastModifiedLedger: 120499 },
  ];

  const after: StorageEntryRaw[] = [
    { key: 'Admin', value: 'CBVNIITX42KQA3MKNUBKG4YIK4FCASZQWKWGHY3YYMM4ANGZ6MOZI2EC', durability: 'instance', lastModifiedLedger: 120500 },
    { key: { symbol: 'TotalPool' }, value: { u64: 52500000000 }, durability: 'instance', lastModifiedLedger: 120530 },
    { key: { address: 'GBXWW2ZJ6Z4EXAMPLE1' }, value: { balance: 12500, rank: 'Gold' }, durability: 'persistent', lastModifiedLedger: 120528 },
    { key: { address: 'GBXWW2ZJ6Z4EXAMPLE2' }, value: { balance: 5000, rank: 'Bronze' }, durability: 'persistent', lastModifiedLedger: 120529 },
  ];

  return { before, after };
}

export interface CliOptions {
  contractId?: string;
  beforeLedger?: string;
  afterLedger?: string;
  beforeFile?: string;
  afterFile?: string;
  rpcUrl?: string;
  format?: string;
  out?: string;
}

export class CliUsageError extends Error {}

/** Reads and JSON-parses a snapshot file. Throws CliUsageError (rather than
 * calling process.exit directly) so this is testable without killing the
 * test process. */
export function loadEntriesFromFile(filePath: string): StorageEntryRaw[] {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new CliUsageError(`snapshot file not found at ${resolved}`);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

/** Resolves the (before, after) snapshot pair for a parsed CLI options
 * object, given either a file-pair or a ledger-pair (falling back to the
 * demo dataset for the ledger-pair case, since no live RPC is reachable in
 * this sandbox). Separated from the Commander wiring in index.ts so both
 * branches — and their validation errors — are unit-testable. */
export function resolveSnapshotPair(options: CliOptions): {
  before: StorageEntryRaw[];
  after: StorageEntryRaw[];
} {
  if (options.beforeFile && options.afterFile) {
    return {
      before: loadEntriesFromFile(options.beforeFile),
      after: loadEntriesFromFile(options.afterFile),
    };
  }

  if (options.beforeLedger && options.afterLedger) {
    if (!options.contractId) {
      throw new CliUsageError('--contract-id is required with --before-ledger/--after-ledger');
    }
    return demoSnapshotPair();
  }

  throw new CliUsageError(
    'provide either --before-file and --after-file, or --contract-id with --before-ledger and --after-ledger',
  );
}
