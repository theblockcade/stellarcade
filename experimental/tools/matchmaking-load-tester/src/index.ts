#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VirtualPlayer } from './virtual-player';
import { MetricsCollector } from './metrics';
import type { LoadTestConfig, LoadTestSummary, VirtualPlayerOptions } from './types';

const program = new Command();

program
  .name('matchmaking-load-tester')
  .description('Simulated multi-player matchmaking queue load tester')
  .version('0.0.1');

program
  .command('run')
  .description('Spawn concurrent virtual players against the matchmaking queue')
  .option('--players <n>', 'Total number of virtual players to simulate', '50')
  .option('--duration-sec <s>', 'Max duration to allow the run to take, in seconds', '60')
  .option('--api-url <url>', 'Matchmaking API base URL', 'http://localhost:8080')
  .option('--game-type <type>', 'Game type to queue for', 'coin-flip')
  .option('--concurrency <c>', 'Max number of players running concurrently', '10')
  .option('--json', 'Output raw JSON summary instead of a formatted table', false)
  .action(async (options) => {
    const config: LoadTestConfig = {
      players: parseInt(options.players, 10),
      durationSec: parseInt(options.durationSec, 10),
      apiUrl: options.apiUrl,
      gameType: options.gameType,
      concurrency: parseInt(options.concurrency, 10),
    };

    const summary = await runLoadTest(config);

    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      printSummary(config, summary);
    }
  });

/**
 * Runs `config.players` virtual players with at most `config.concurrency`
 * running at once, bounded by `config.durationSec`, and returns the
 * aggregate metrics summary. Never throws: every player failure is
 * captured as a metric rather than propagated.
 */
export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestSummary> {
  const metrics = new MetricsCollector();
  const matchAcceptTimeoutMs = config.matchAcceptTimeoutMs ?? 5000;
  const heartbeatIntervalMs = config.heartbeatIntervalMs ?? 2000;
  const deadlineAt = Date.now() + Math.max(0, config.durationSec) * 1000;

  const totalPlayers = Math.max(0, config.players);
  const concurrency = Math.max(1, config.concurrency);

  let nextPlayerIndex = 0;

  const spawnNext = async (): Promise<void> => {
    if (nextPlayerIndex >= totalPlayers || Date.now() >= deadlineAt) {
      return;
    }

    const playerOptions: VirtualPlayerOptions = {
      id: `player_${nextPlayerIndex++}`,
      apiUrl: config.apiUrl,
      gameType: config.gameType,
      matchAcceptTimeoutMs,
      heartbeatIntervalMs,
    };

    const player = new VirtualPlayer(playerOptions);
    const result = await player.run();

    if (result.queueWaitMs !== undefined) {
      metrics.recordQueueWait(result.queueWaitMs);
    }
    if (result.pairingLatencyMs !== undefined) {
      metrics.recordPairingLatency(result.pairingLatencyMs);
    }

    switch (result.outcome) {
      case 'completed':
        metrics.recordMatchCompleted();
        break;
      case 'timeout':
        metrics.recordTimeout();
        break;
      case 'disconnect':
        metrics.recordDisconnect();
        break;
      case 'error':
        metrics.recordError();
        break;
    }

    await spawnNext();
  };

  const workers = Array.from({ length: Math.min(concurrency, totalPlayers) }, () => spawnNext());
  await Promise.all(workers);

  return metrics.summarize(totalPlayers);
}

function printSummary(config: LoadTestConfig, summary: LoadTestSummary): void {
  console.log(chalk.blue('🎮 Matchmaking Load Tester'));
  console.log(chalk.gray(`API URL: ${config.apiUrl}`));
  console.log(chalk.gray(`Game Type: ${config.gameType}`));
  console.log(chalk.gray(`Players: ${config.players}`));
  console.log(chalk.gray(`Concurrency: ${config.concurrency}`));
  console.log(chalk.gray(`Duration cap: ${config.durationSec}s`));
  console.log();

  console.log(chalk.bold('Outcomes'));
  console.log(chalk.green(`  Completed matches: ${summary.completedMatches}`));
  console.log(chalk.yellow(`  Timeouts:          ${summary.timeouts} (${(summary.timeoutRate * 100).toFixed(1)}%)`));
  console.log(chalk.gray(`  Disconnects:       ${summary.disconnects}`));
  console.log(chalk.red(`  Errors:            ${summary.errors} (${(summary.errorRate * 100).toFixed(1)}%)`));
  console.log();

  console.log(chalk.bold('Queue Wait (ms)'));
  printPercentileRow(summary.queueWaitMs);
  console.log();

  console.log(chalk.bold('Pairing Latency (ms)'));
  printPercentileRow(summary.pairingLatencyMs);
  console.log();

  console.log(chalk.gray(`Total wall time: ${summary.durationMs}ms`));
}

function printPercentileRow(stats: LoadTestSummary['queueWaitMs']): void {
  if (stats.count === 0) {
    console.log(chalk.gray('  No samples recorded'));
    return;
  }

  console.log(
    chalk.gray(
      `  count=${stats.count} min=${stats.min.toFixed(0)} mean=${stats.mean.toFixed(0)} ` +
        `p50=${stats.p50.toFixed(0)} p95=${stats.p95.toFixed(0)} p99=${stats.p99.toFixed(0)} max=${stats.max.toFixed(0)}`
    )
  );
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
