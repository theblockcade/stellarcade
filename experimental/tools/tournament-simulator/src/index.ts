#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runTournament } from './simulator';
import type { TournamentConfig, TournamentSummary } from './types';

const program = new Command();

program
  .name('tournament-simulator')
  .description('End-to-end tournament simulation runner: registration through champion resolution')
  .version('0.0.1');

program
  .command('run', { isDefault: true })
  .description('Simulate a full single-elimination tournament and verify payouts')
  .option('--size <n>', 'Number of players (must be a power of two: 4, 8, 16, 32, ...)', '8')
  .option('--wager <amount>', 'Wager amount per player', '100')
  .option('--fee-bps <bps>', 'Protocol fee in basis points', '500')
  .option('--seed <n>', 'PRNG seed for reproducible runs')
  .option('--rpc-url <url>', 'Soroban RPC URL (accepted for interface parity; unused by this simulator — see README Known Limitations)')
  .option('--json', 'Output the structured summary as JSON instead of the formatted transcript', false)
  .action((options) => {
    const config: TournamentConfig = {
      size: parseInt(options.size, 10),
      wager: parseFloat(options.wager),
      feeBps: parseInt(options.feeBps, 10),
      seed: options.seed !== undefined ? parseInt(options.seed, 10) : undefined,
    };

    let summary: TournamentSummary;
    try {
      summary = runTournament(config);
    } catch (error) {
      console.error(chalk.red(`Simulation failed: ${(error as Error).message}`));
      process.exitCode = 1;
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      printTranscript(summary);
      printReport(summary);
    }

    if (summary.issues.length > 0) {
      process.exitCode = 1;
    }
  });

function printTranscript(summary: TournamentSummary): void {
  console.log(chalk.blue('🏆 Tournament Simulator'));
  console.log(chalk.gray(`Size: ${summary.config.size} | Wager: ${summary.config.wager} | Fee: ${summary.config.feeBps}bps`));
  console.log();
  for (const line of summary.transcript) {
    console.log(line);
  }
  console.log();
}

function printReport(summary: TournamentSummary): void {
  console.log(chalk.bold('Summary Report'));
  console.log(chalk.gray(`  Rounds played:     ${summary.rounds.length}`));
  console.log(chalk.gray(`  Total matches:     ${summary.rounds.reduce((n, r) => n + r.matches.length, 0)}`));
  console.log(chalk.green(`  Champion:          ${summary.champion?.id ?? 'NONE'} (+${summary.disbursements.find((d) => d.placement === 'champion')?.amount ?? 0})`));
  console.log(chalk.green(`  Runner-up:         ${summary.runnerUp?.id ?? 'NONE'} (+${summary.disbursements.find((d) => d.placement === 'runner-up')?.amount ?? 0})`));
  console.log(chalk.gray(`  Protocol fee:      ${summary.protocolFee}`));

  if (summary.issues.length === 0) {
    console.log(chalk.green(`  Verification:      PASSED`));
  } else {
    console.log(chalk.red(`  Verification:      FAILED (${summary.issues.length} issue(s))`));
    for (const issue of summary.issues) {
      console.log(chalk.red(`    - ${issue}`));
    }
  }
}

program.parse(process.argv);
