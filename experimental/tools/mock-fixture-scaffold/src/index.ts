#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scaffoldFixture, resolveScaffoldOptions, ScaffoldOverwriteError, InvalidTemplateError } from './scaffolder';

const program = new Command();

program
  .name('mock-fixture-scaffold')
  .description('Scaffold a standardized Soroban contract test.rs fixture')
  .version('0.0.1')
  .requiredOption('--contract <name>', 'Contract name, kebab-case (e.g. badge-evolution)')
  .option('--template <type>', 'single-player | multi-player | staking', 'single-player')
  .option('--out <dir>', 'Output directory for the generated test.rs', './src')
  .option('--force', 'Overwrite an existing test.rs if present', false)
  .action((rawOptions) => {
    try {
      const options = resolveScaffoldOptions(rawOptions);
      const result = scaffoldFixture(options);
      console.log(chalk.green(`✅ Wrote fixture to ${result.filePath}`));
    } catch (err) {
      if (err instanceof ScaffoldOverwriteError || err instanceof InvalidTemplateError) {
        console.error(chalk.red(`❌ ${err.message}`));
        process.exit(1);
      }
      throw err;
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
