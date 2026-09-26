#!/usr/bin/env node

import * as fs from 'fs';
import { Command } from 'commander';
import { parseAuthEntries, analyzeAuthEntries, renderAuthTree, formatDiagnostics } from './checker';

const program = new Command();

program
  .name('contract-auth-checker')
  .description('Trace Soroban simulated auth call trees and verify invoker/authorization footprints')
  .version('0.0.1')
  .requiredOption('--sim-result <path>', 'Path to a JSON file containing simulateTransaction auth entries')
  .option('--warn-cross-contract', 'Exit with code 1 if any cross-contract authorization call is found', false)
  .option('--json', 'Output the raw JSON diagnostic report instead of formatted text', false)
  .action((options) => {
    if (!fs.existsSync(options.simResult)) {
      console.error(`Error: File not found: ${options.simResult}`);
      process.exitCode = 2;
      return;
    }

    let entries;
    try {
      const raw = JSON.parse(fs.readFileSync(options.simResult, 'utf8'));
      entries = parseAuthEntries(raw);
    } catch (err) {
      console.error(`Error: invalid --sim-result file: ${(err as Error).message}`);
      process.exitCode = 2;
      return;
    }

    const diagnostics = analyzeAuthEntries(entries);

    if (options.json) {
      console.log(JSON.stringify({ entries, diagnostics }, null, 2));
    } else {
      for (const entry of entries) {
        console.log(renderAuthTree(entry));
        console.log('');
      }
      console.log(formatDiagnostics(diagnostics));
    }

    const shouldWarn = options.warnCrossContract && diagnostics.crossContractCalls.length > 0;
    process.exitCode = shouldWarn || diagnostics.privilegeEscalationRisks.length > 0 ? 1 : 0;
  });

if (require.main === module) {
  program.parse(process.argv);
}

export { parseAuthEntries, analyzeAuthEntries, renderAuthTree } from './checker';
export * from '../types';
