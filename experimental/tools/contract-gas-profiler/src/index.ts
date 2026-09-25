#!/usr/bin/env node

import * as fs from 'fs';
import { Command } from 'commander';
import { profileContract, formatReport } from './profiler';
import type { ProfileResult } from '../types';

const program = new Command();

program
  .name('contract-gas-profiler')
  .description(
    'Estimate CPU instruction / memory / storage budget consumption for a Soroban contract invocation (simulated, see README).'
  )
  .version('0.0.1')
  .requiredOption('--wasm <path>', 'Path to the compiled Soroban contract WASM binary')
  .requiredOption('--fn <name>', 'Contract function name to profile')
  .option('--args <json>', 'JSON array of arguments to pass to the function', '[]')
  .option('--max-cpu-pct <n>', 'Warning threshold, as % of max CPU budget', '100')
  .option('--threshold <n>', 'Alias for --max-cpu-pct')
  .option('--json', 'Output the raw JSON result instead of a formatted table', false)
  .action(async (options) => {
    const wasmPath: string = options.wasm;

    if (!fs.existsSync(wasmPath)) {
      console.error(`Error: File not found: ${wasmPath}`);
      process.exitCode = 2;
      return;
    }

    let args: unknown[];
    try {
      const parsed = JSON.parse(options.args);
      if (!Array.isArray(parsed)) {
        throw new Error('--args must be a JSON array');
      }
      args = parsed;
    } catch (err) {
      console.error(`Error: invalid --args JSON: ${(err as Error).message}`);
      process.exitCode = 2;
      return;
    }

    const maxCpuPctRaw = options.threshold ?? options.maxCpuPct;
    const maxCpuPct = parseFloat(maxCpuPctRaw);
    if (Number.isNaN(maxCpuPct)) {
      console.error('Error: --max-cpu-pct must be a number');
      process.exitCode = 2;
      return;
    }

    try {
      const wasmBuffer = fs.readFileSync(wasmPath);
      const result: ProfileResult = await profileContract(wasmBuffer, options.fn, args, {
        maxCpuPct,
        wasmPath,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatReport(result));
      }

      process.exitCode = result.exceededThreshold ? 1 : 0;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unexpected error occurred');
      }
      process.exitCode = 2;
    }
  });

if (require.main === module) {
  program.parseAsync(process.argv);
}

export { profileContract } from './profiler';
export * from '../types';
