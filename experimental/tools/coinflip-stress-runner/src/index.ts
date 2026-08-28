#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runBotPlayer, makeRng } from './bot-player';
import { BankrollTracker, formatReport } from './bankroll-tracker';
import type { BetStrategy, PlayerStats, StressTestConfig } from './types';

const program = new Command();

program
  .name('coinflip-stress-runner')
  .description('Multi-round coinflip bot stress test runner for house edge solvency verification')
  .version('0.0.1');

program
  .command('run', { isDefault: true })
  .description('Run coinflip bots concurrently and verify house edge solvency')
  .option('--rounds <n>', 'Number of rounds per bot', '100')
  .option('--concurrency <c>', 'Number of concurrent bots', '5')
  .option('--strategy <strategy>', 'Betting strategy: flat, martingale, fibonacci', 'flat')
  .option('--rpc-url <url>', 'Soroban RPC URL (accepted for interface parity; unused by this local simulator)')
  .option('--starting-balance <n>', 'Initial balance per bot', '10000')
  .option('--base-bet <n>', 'Base bet amount per round', '100')
  .option('--seed <n>', 'PRNG seed for reproducible runs')
  .option('--json', 'Output the structured summary as JSON instead of the formatted report', false)
  .action((options) => {
    const strategy: BetStrategy = options.strategy;
    if (!['flat', 'martingale', 'fibonacci'].includes(strategy)) {
      console.error(chalk.red(`Invalid strategy: ${strategy}. Must be flat, martingale, or fibonacci.`));
      process.exitCode = 1;
      return;
    }

    const config: StressTestConfig = {
      rounds: parseInt(options.rounds, 10),
      concurrency: parseInt(options.concurrency, 10),
      strategy,
      rpcUrl: options.rpcUrl ?? 'https://soroban-testnet.stellar.org',
      startingBalance: parseInt(options.startingBalance, 10),
      baseBet: parseInt(options.baseBet, 10),
      seed: options.seed !== undefined ? parseInt(options.seed, 10) : undefined,
    };

    const summary = runStressTest(config);

    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      const report = formatReport(summary);
      for (const line of report) {
        console.log(line);
      }
    }

    if (summary.issues.length > 0) {
      process.exitCode = 1;
    }
  });

// ─── Stress Test Engine ──────────────────────────────────────────────────────

function runStressTest(config: StressTestConfig): ReturnType<BankrollTracker['generateSummary']> {
  console.log(chalk.blue('Coinflip Stress Test Runner'));
  console.log(chalk.gray(
    `Strategy: ${config.strategy} | Bots: ${config.concurrency} | ` +
    `Rounds/bot: ${config.rounds} | Seed: ${config.seed ?? 'random'}`,
  ));
  console.log();

  const baseSeed = config.seed ?? Date.now();
  const tracker = new BankrollTracker();
  const players: PlayerStats[] = [];
  const transcript: string[] = [];

  for (let i = 0; i < config.concurrency; i++) {
    const playerId = `bot_${i + 1}`;
    const playerSeed = baseSeed + i * 1_000_000; // Offset seeds per bot.
    const rng = makeRng(playerSeed);

    process.stdout.write(chalk.gray(`  Running ${playerId}...`));

    const result = runBotPlayer({
      id: playerId,
      strategy: config.strategy,
      startingBalance: config.startingBalance,
      baseBet: config.baseBet,
      rounds: config.rounds,
      rng,
    });

    // Record all rounds in the bankroll tracker.
    for (const round of result.rounds) {
      tracker.recordRound(playerId, round.bet, round.won);
    }

    players.push(result.stats);

    const profitSign = result.stats.netProfit >= 0 ? '+' : '';
    console.log(chalk.gray(
      ` done (${result.stats.wins}W/${result.stats.losses}L, ` +
      `net: ${profitSign}${result.stats.netProfit})`,
    ));
  }

  console.log();

  // Build transcript from per-player summaries.
  transcript.push(`Stress test completed: ${config.concurrency} bots x ${config.rounds} rounds.`);
  transcript.push(`Strategy: ${config.strategy}`);
  for (const player of players) {
    const profitSign = player.netProfit >= 0 ? '+' : '';
    transcript.push(
      `  ${player.id}: ${player.wins}W/${player.losses}L, ` +
      `wagered ${player.totalWagered}, payout ${player.totalPayout}, ` +
      `net ${profitSign}${player.netProfit}, gas ${player.gasSpent}`,
    );
  }

  return tracker.generateSummary(config, players, transcript);
}

program.parse(process.argv);
