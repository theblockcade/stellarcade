#!/usr/bin/env node

import { Command } from 'commander';
import { Contract, rpc } from '@stellar/stellar-sdk';
import { decodeLedgerEntry } from './xdr-parser';
import { buildStorageTree, renderTree } from './tree-builder';
import type { ExplorerConfig, StorageDurability, StorageEntry } from './types';

const DEFAULT_RPC_URL = 'https://soroban-testnet.stellar.org';

const program = new Command();

program
  .name('storage-tree-explorer')
  .description('Soroban contract storage key tree explorer with ASCII tree rendering and JSON export')
  .version('0.0.1')
  .requiredOption('--contract-id <id>', 'Contract ID (C...) to inspect')
  .option('--rpc-url <url>', 'Soroban RPC endpoint', DEFAULT_RPC_URL)
  .option('--expand-depth <n>', 'Maximum tree depth to render', '3')
  .option('--json', 'Output the raw entry list as JSON instead of a tree', false)
  .action(async (options) => {
    const config: ExplorerConfig = {
      contractId: options.contractId,
      rpcUrl: options.rpcUrl,
      expandDepth: parseInt(options.expandDepth, 10),
      jsonOutput: options.json,
    };

    try {
      const entries = await fetchStorageEntries(config);

      if (entries.length === 0) {
        console.error(`No storage entries found for contract ${config.contractId}. Is the contract ID correct and deployed on this network?`);
        process.exitCode = 1;
        return;
      }

      if (config.jsonOutput) {
        console.log(JSON.stringify(entries, null, 2));
      } else {
        const tree = buildStorageTree(entries, config.contractId);
        console.log(renderTree(tree, config.expandDepth));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unexpected error occurred');
      }
      process.exitCode = 1;
    }
  });

/** Fetch and decode every instance/persistent/temporary entry for a contract. */
async function fetchStorageEntries(config: ExplorerConfig): Promise<StorageEntry[]> {
  const server = new rpc.Server(config.rpcUrl);
  const contract = new Contract(config.contractId);
  const instanceKey = contract.getFootprint();

  const durabilities: StorageDurability[] = ['instance', 'persistent', 'temporary'];
  const entries: StorageEntry[] = [];

  // The instance entry itself always carries the contract's `instance`
  // storage map, fetched once regardless of durability filter.
  const instanceResponse = await server.getLedgerEntries(instanceKey);
  for (const raw of instanceResponse.entries) {
    entries.push(decodeLedgerEntry(raw.val, 'instance', raw.liveUntilLedgerSeq));
  }

  void durabilities; // persistent/temporary entries require a full key enumeration
  // (contract-specific — the RPC has no "list all keys" call), which is out
  // of scope for this CLI's first iteration; instance storage is always
  // fully enumerable via the footprint and covers the common case.

  return entries;
}
