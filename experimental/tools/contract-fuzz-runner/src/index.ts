#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runFuzz } from './fuzzer';
import { createReferenceVaultTarget } from './reference-vault';
import type { FunctionCall, FuzzRunResult, FuzzTarget } from './types';

const program = new Command();

/**
 * Registry of fuzz targets available via `--contract <name>`. Only the
 * in-memory reference vault is registered today — see README Known
 * Limitations for why this doesn't wire up to a live deployed Soroban
 * contract yet. New targets are added by implementing `FuzzTarget<TState>`
 * (see `reference-vault.ts`) and registering them here.
 */
const TARGETS: Record<string, () => FuzzTarget<unknown>> = {
  'reference-vault': () => createReferenceVaultTarget(false) as FuzzTarget<unknown>,
  'reference-vault-buggy': () => createReferenceVaultTarget(true) as FuzzTarget<unknown>,
};

program
  .name('contract-fuzz-runner')
  .description('Property-based fuzz testing runner for Soroban contract state machines')
  .version('0.0.1')
  .requiredOption('--contract <name>', `Fuzz target to run (available: ${Object.keys(TARGETS).join(', ')})`)
  .option('--runs <n>', 'Number of randomized sequences to attempt', '100')
  .option('--seed <n>', 'Random seed for reproducible runs', String(Date.now() & 0xffffffff))
  .option('--max-sequence-length <n>', 'Maximum calls per generated sequence', '8')
  .option('--json', 'Output the raw result as JSON instead of a formatted report', false)
  .action((options) => {
    const targetFactory = TARGETS[options.contract];
    if (!targetFactory) {
      console.error(
        chalk.red(`✗ Unknown --contract "${options.contract}". Available: ${Object.keys(TARGETS).join(', ')}`)
      );
      process.exitCode = 1;
      return;
    }

    const seed = parseInt(options.seed, 10);
    const runs = parseInt(options.runs, 10);
    const maxSequenceLength = parseInt(options.maxSequenceLength, 10);

    const result = runFuzz(targetFactory(), { runs, seed, maxSequenceLength });

    if (options.json) {
      console.log(serializeResult(result));
      return;
    }

    printResult(result);

    if (!result.passed) {
      process.exitCode = 1;
    }
  });

/** JSON.stringify with bigint support (bigints appear in call args/state). */
function serializeResult(result: FuzzRunResult): string {
  return JSON.stringify(result, (_key, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
}

function formatArgs(call: FunctionCall): string {
  const parts = Object.entries(call.args).map(([k, v]) => `${k}=${String(v)}`);
  return `${call.functionName}(${parts.join(', ')})`;
}

function printResult(result: FuzzRunResult): void {
  console.log(chalk.blue('🐛 Contract Fuzz Runner'));
  console.log(chalk.gray(`Contract: ${result.contractName}`));
  console.log(chalk.gray(`Seed: ${result.seed} | Runs: ${result.totalRuns}`));
  console.log();

  if (result.passed) {
    console.log(chalk.green(`✓ No invariant violations or unexpected panics found across ${result.totalRuns} run(s).`));
    return;
  }

  console.log(chalk.red('✗ Failure found!'));
  console.log();

  if (result.firstFailure?.panicked) {
    console.log(chalk.red(`  Unexpected panic: ${result.firstFailure.panicMessage}`));
  }
  for (const violation of result.firstFailure?.violatedInvariants ?? []) {
    console.log(chalk.red(`  Invariant violated: ${violation}`));
  }

  console.log();
  console.log(chalk.bold('Minimal reproduction sequence:'));
  result.reproductionSequence.forEach((call, i) => {
    console.log(chalk.yellow(`  ${i + 1}. ${formatArgs(call)}`));
  });
  console.log();
  console.log(chalk.gray(`Re-run this exact sequence with: --seed ${result.seed}`));
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
