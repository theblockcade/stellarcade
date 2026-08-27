#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { LiquidityBot, SimulatedExecutor } from './bot';
import type { BotConfig, RunSummary, TradeResult } from './types';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got "${raw}"`);
  }
  return parsed;
}

/**
 * Loads bot configuration from environment variables per the issue's
 * "Interface / Endpoint / Method Details" spec: `BOT_SECRET_KEY`,
 * `CONTRACT_ID`, `RPC_URL`, `TRADE_INTERVAL_MS`, `MAX_POSITION_XLM`.
 * `--dry-run` (see CLI options below) relaxes the secret-key/contract-id
 * requirement so the bot can run against the built-in simulated pool
 * without any live credentials.
 */
export function loadConfigFromEnv(dryRun: boolean): BotConfig {
  return {
    botSecretKey: dryRun ? process.env.BOT_SECRET_KEY ?? 'SDRYRUN000000000000000000000000000000000000000000000000000' : requireEnv('BOT_SECRET_KEY'),
    contractId: dryRun ? process.env.CONTRACT_ID ?? 'DRY_RUN_CONTRACT' : requireEnv('CONTRACT_ID'),
    rpcUrl: dryRun ? process.env.RPC_URL ?? 'https://soroban-testnet.stellar.org' : requireEnv('RPC_URL'),
    tradeIntervalMs: numberEnv('TRADE_INTERVAL_MS', 5000),
    maxPositionXlm: numberEnv('MAX_POSITION_XLM', 1000),
    emergencyReserveXlm: numberEnv('EMERGENCY_RESERVE_XLM', 5),
    driftBias: numberEnv('DRIFT_BIAS', 0.5),
    minTradeXlm: numberEnv('MIN_TRADE_XLM', 1),
    maxTradeXlm: numberEnv('MAX_TRADE_XLM', 25),
    maxSlippage: numberEnv('MAX_SLIPPAGE', 0.05),
    seed: numberEnv('SEED', Date.now() & 0xffffffff),
  };
}

function formatTrade(result: TradeResult): string {
  const sideColor = result.decision.side === 'buy' ? chalk.green : chalk.red;
  const amountLabel = result.decision.side === 'buy' ? `${result.amount} tokens minted` : `${result.amount} units returned`;
  return (
    `${sideColor(result.decision.side.toUpperCase().padEnd(4))} ` +
    `${result.decision.sizeXlm.toFixed(2)} notional (${amountLabel}) | ` +
    `tx=${result.txHash} | ` +
    `gas=${result.gasStroops}stroops | ` +
    `slippage=${(result.slippage * 100).toFixed(3)}% | ` +
    chalk.gray(result.decision.reason)
  );
}

function printSummary(summary: RunSummary): void {
  console.log();
  console.log(chalk.bold('Run Summary'));
  console.log(`  Trades executed: ${summary.tradesExecuted} (${summary.buys} buys, ${summary.sells} sells)`);
  console.log(`  Trades skipped:  ${summary.tradesSkipped}`);
  console.log(`  Total volume:    ${summary.totalVolumeXlm.toFixed(2)} XLM (notional)`);
  console.log(`  Total gas:       ${summary.totalGasStroops} stroops`);
  console.log(`  Avg slippage:    ${(summary.averageSlippage * 100).toFixed(3)}%`);
  console.log(`  Duration:        ${((summary.endedAt - summary.startedAt) / 1000).toFixed(1)}s`);
  if (summary.haltedReason) {
    console.log(chalk.red(`  Halted:          ${summary.haltedReason}`));
  }
}

const program = new Command();

program
  .name('bonding-curve-lp-bot')
  .description('Automated liquidity provider bot that trades against a dynamic bonding curve pool')
  .version('0.0.1')
  .option('--dry-run', 'Run against an in-memory simulated pool instead of requiring live credentials', false)
  .option('--cycles <n>', 'Number of trade cycles to run before stopping (omit for continuous)', (v) => parseInt(v, 10))
  .option('--json-summary', 'Print the final run summary as JSON instead of formatted text', false)
  .action(async (options) => {
    let config: BotConfig;
    try {
      config = loadConfigFromEnv(Boolean(options.dryRun));
    } catch (err) {
      console.error(chalk.red(`✗ ${(err as Error).message}`));
      process.exitCode = 1;
      return;
    }

    console.log(chalk.blue('💧 Bonding Curve LP Bot'));
    console.log(chalk.gray(`  Contract:       ${config.contractId}`));
    console.log(chalk.gray(`  RPC:            ${config.rpcUrl}`));
    console.log(chalk.gray(`  Trade interval: ${config.tradeIntervalMs}ms`));
    console.log(chalk.gray(`  Max position:   ${config.maxPositionXlm} XLM`));
    console.log(chalk.gray(`  Emergency reserve: ${config.emergencyReserveXlm} XLM`));
    console.log(chalk.gray(`  Mode:           ${options.dryRun ? 'dry-run (simulated pool)' : 'live'}`));
    console.log();

    if (!options.dryRun) {
      console.error(
        chalk.red(
          '✗ Live trading requires a real TradeExecutor wired to @stellar/stellar-sdk, which is not implemented ' +
            'in this MVP (see README Known Limitations). Re-run with --dry-run to use the simulated pool.'
        )
      );
      process.exitCode = 1;
      return;
    }

    // slope=2, exponent=1 matches the contract's own test fixtures
    // (see `experimental/contracts/dynamic-bonding-curve/src/test.rs`).
    const executor = new SimulatedExecutor({ slope: 2n, exponent: 1 }, 5000, config.seed);
    const bot = new LiquidityBot(config, executor);

    const shutdown = () => {
      console.log(chalk.yellow('\nReceived shutdown signal, finishing current cycle...'));
      bot.stop();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    const summary = await bot.run({
      maxCycles: Number.isFinite(options.cycles) ? options.cycles : Infinity,
      onTrade: (result) => console.log(formatTrade(result)),
      onSkip: (decision, reason) => console.log(chalk.yellow(`⚠ Skipped ${decision.side}: ${reason}`)),
      onHalt: (reason) => console.log(chalk.red(`✗ Halted: ${reason}`)),
    });

    if (options.jsonSummary) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      printSummary(summary);
    }

    if (summary.haltedReason) {
      process.exitCode = 1;
    }
  });

if (require.main === module) {
  program.parse(process.argv);
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}
