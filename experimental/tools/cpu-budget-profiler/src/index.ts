#!/usr/bin/env node

import * as fs from 'fs';
import { Command } from 'commander';
import { Contract, rpc, TransactionBuilder, Networks, BASE_FEE, nativeToScVal, Keypair } from '@stellar/stellar-sdk';
import { extractMetrics, computeUtilization, generateWarnings } from './profiler';
import { printTerminal, printJson, toMarkdownTable } from './reporter';
import type { ProfileResult, ProfilerConfig } from './types';

const DEFAULT_RPC_URL = 'https://soroban-testnet.stellar.org';

const program = new Command();

program
  .name('cpu-budget-profiler')
  .description('Soroban contract CPU instruction and memory budget profiling CLI')
  .version('0.0.1')
  .requiredOption('--contract-id <id>', 'Contract ID (C...) to profile')
  .requiredOption('--method <name>', 'Contract method to simulate')
  .option('--args <json>', 'JSON array of arguments to pass to the method', '[]')
  .option('--rpc-url <url>', 'Soroban RPC endpoint', DEFAULT_RPC_URL)
  .option('--source-account <id>', 'Source account (G...) to simulate from; a throwaway keypair is used if omitted')
  .option('--json', 'Output result as JSON', false)
  .option('--out <path>', 'Write a markdown benchmark table to this path')
  .action(async (options) => {
    let args: unknown[];
    try {
      args = JSON.parse(options.args);
      if (!Array.isArray(args)) throw new Error('--args must be a JSON array');
    } catch (e) {
      console.error(`Error parsing --args: ${e instanceof Error ? e.message : e}`);
      process.exitCode = 1;
      return;
    }

    const config: ProfilerConfig = {
      contractId: options.contractId,
      method: options.method,
      args,
      rpcUrl: options.rpcUrl,
      sourceAccount: options.sourceAccount,
    };

    try {
      const result = await profileMethod(config);

      if (options.json) {
        printJson(result);
      } else {
        printTerminal(result);
      }

      if (options.out) {
        fs.writeFileSync(options.out, toMarkdownTable([result]));
        console.log(`Benchmark table written to ${options.out}`);
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    }
  });

/** Simulate `config.method` on `config.contractId` and extract its budget profile. */
export async function profileMethod(config: ProfilerConfig): Promise<ProfileResult> {
  const server = new rpc.Server(config.rpcUrl);
  const contract = new Contract(config.contractId);

  const sourceKeypair = config.sourceAccount ? null : Keypair.random();
  const sourceAccountId = config.sourceAccount ?? sourceKeypair!.publicKey();
  const account = await server.getAccount(sourceAccountId);

  const scArgs = config.args.map((a) => nativeToScVal(a));
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(contract.call(config.method, ...scArgs))
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  const metrics = extractMetrics(simulation.cost);
  const utilization = computeUtilization(metrics);
  const warnings = generateWarnings(utilization);

  return {
    contractId: config.contractId,
    method: config.method,
    metrics,
    utilization,
    warnings,
  };
}

if (require.main === module) {
  program.parse();
}
