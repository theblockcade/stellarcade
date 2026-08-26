#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { MetricsCollector } from './metrics-collector';
import { LoadRunner } from './load-runner';
import type { ThroughputConfig } from './types';

const program = new Command();

program
  .name('throughput-latency-tester')
  .description('Benchmark throughput (TPS) and latency percentiles under configurable concurrency loads')
  .version('0.0.1');

program
  .command('run')
  .description('Run a throughput-latency benchmark against simulated transactions')
  .requiredOption('--contract-id <id>', 'Soroban contract ID to target')
  .option('--method <m>', 'Contract method to invoke', 'transfer')
  .option('--total <n>', 'Total number of transactions to fire', '100')
  .option('--concurrency <c>', 'Maximum concurrent transactions', '10')
  .option('--rpc-url <url>', 'Soroban RPC endpoint URL', 'http://localhost:8000/soroban/rpc')
  .option('--ramp-up-ms <ms>', 'Time in ms to ramp concurrency from 1 to target', '2000')
  .action(async (options) => {
    const config: ThroughputConfig = {
      rpcUrl: options.rpcUrl,
      contractId: options.contractId,
      method: options.method,
      totalRequests: parseInt(options.total, 10),
      concurrency: parseInt(options.concurrency, 10),
      rampUpMs: parseInt(options.rampUpMs, 10),
    };

    console.log(chalk.blue('Throughput Latency Tester'));
    console.log(chalk.gray(`RPC URL:       ${config.rpcUrl}`));
    console.log(chalk.gray(`Contract ID:   ${config.contractId}`));
    console.log(chalk.gray(`Method:        ${config.method}`));
    console.log(chalk.gray(`Total:         ${config.totalRequests}`));
    console.log(chalk.gray(`Concurrency:   ${config.concurrency}`));
    console.log(chalk.gray(`Ramp-up:       ${config.rampUpMs}ms`));
    console.log();

    const collector = new MetricsCollector();
    const runner = new LoadRunner(config, collector);
    const summary = await runner.run();

    printSummary(summary);
  });

function printSummary(summary: import('./types').MetricsSummary): void {
  console.log(chalk.bold('Results'));
  console.log(chalk.gray(`  Total requests:    ${summary.totalRequests}`));
  console.log(chalk.green(`  Successes:         ${summary.successCount}`));
  console.log(chalk.red(`  Failures:          ${summary.failureCount}`));
  console.log();

  console.log(chalk.bold('Throughput'));
  console.log(chalk.gray(`  Peak TPS:          ${summary.peakTps.toFixed(2)}`));
  console.log(chalk.gray(`  Sustained TPS:     ${summary.sustainedTps.toFixed(2)}`));
  console.log();

  console.log(chalk.bold('Latency'));
  console.log(chalk.gray(`  Average:           ${summary.avgLatencyMs.toFixed(1)}ms`));
  console.log(chalk.gray(`  p50:               ${summary.percentiles.p50.toFixed(1)}ms`));
  console.log(chalk.gray(`  p90:               ${summary.percentiles.p90.toFixed(1)}ms`));
  console.log(chalk.gray(`  p95:               ${summary.percentiles.p95.toFixed(1)}ms`));
  console.log(chalk.gray(`  p99:               ${summary.percentiles.p99.toFixed(1)}ms`));
  console.log();

  if (summary.latencyHistogram.length > 0) {
    console.log(chalk.bold('Latency Distribution'));
    const maxCount = Math.max(...summary.latencyHistogram.map((b) => b.count));
    const barWidth = 40;

    for (const bucket of summary.latencyHistogram) {
      const barLen = maxCount > 0 ? Math.round((bucket.count / maxCount) * barWidth) : 0;
      const bar = '#'.repeat(barLen);
      const pct = bucket.percentage.toFixed(1).padStart(5);
      console.log(chalk.gray(`  ${bucket.range.padEnd(12)} ${chalk.cyan(bar)} ${pct}% (${bucket.count})`));
    }
    console.log();
  }
}

program.parse(process.argv);

if (require.main === module && !process.argv.slice(2).length) {
  program.outputHelp();
}
