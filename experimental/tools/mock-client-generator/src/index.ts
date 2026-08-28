#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseRustFunctions } from './contract-parser.js';
import { buildMockClientSource, buildDefaultConfig } from './ts-mock-builder.js';
import type { RustFunction, MockClientConfig } from './types.js';

function findLibRs(contractDir: string): string {
  const candidates = [
    join(contractDir, 'src', 'lib.rs'),
    join(contractDir, 'lib.rs'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Could not find lib.rs in ${contractDir} or ${join(contractDir, 'src')}`);
}

function extractContractName(contractDir: string): string {
  const dirName = contractDir.split('/').filter(Boolean).pop() ?? 'Contract';
  return dirName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const program = new Command();

program
  .name('mock-client-generator')
  .description('Generate TypeScript mock client from Soroban contract Rust source')
  .requiredOption('--contract-dir <path>', 'Path to the Rust contract crate directory')
  .requiredOption('--out <path>', 'Output path for the generated MockClient.ts file')
  .option('--contract-name <name>', 'Contract name (used as class name prefix; defaults to directory name)')
  .option('--latency <ms>', 'Default simulated latency in milliseconds for all methods', '0')
  .option('--include-error-simulation', 'Include error/panic simulation helpers', false)
  .action((options) => {
    try {
      const contractDir = options.contractDir;
      const outPath = options.out;
      const contractName = options.contractName ?? extractContractName(contractDir);
      const latencyMs = parseInt(options.latency, 10);

      if (isNaN(latencyMs) || latencyMs < 0) {
        console.error('Error: --latency must be a non-negative integer.');
        process.exit(1);
      }

      // Find and read lib.rs
      const libRsPath = findLibRs(contractDir);
      console.log(`Reading contract source: ${libRsPath}`);

      const source = readFileSync(libRsPath, 'utf-8');
      const functions = parseRustFunctions(source);

      if (functions.length === 0) {
        console.error('Warning: No public functions found in the contract source.');
      }

      console.log(`Parsed ${functions.length} public function(s):`);
      for (const fn of functions) {
        const args = fn.args.map((a) => `${a.name}: ${a.ty.raw}`).join(', ');
        console.log(`  ${fn.name}(${args}) -> ${fn.returnType.raw}`);
      }

      // Generate mock client source
      const mockSource = buildMockClientSource({
        contractName,
        functions,
        defaultLatencyMs: latencyMs,
        includeErrorSimulation: options.includeErrorSimulation,
      });

      writeFileSync(outPath, mockSource, 'utf-8');
      console.log(`\nGenerated mock client: ${outPath}`);

      // Also write a default config file
      const config: MockClientConfig = buildDefaultConfig(functions, latencyMs);
      const configPath = outPath.replace(/\.ts$/, '.config.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log(`Generated config: ${configPath}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
