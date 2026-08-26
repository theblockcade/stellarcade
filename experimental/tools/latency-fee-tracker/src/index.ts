#!/usr/bin/env node
import { Command } from 'commander';
import { fetchLedgerSamples, calculateMetrics, formatMetricsSummary, writeMetricsToJson } from './tracker.js';

const program = new Command();

program
  .name('latency-fee-tracker')
  .description('Monitor recent Stellar network ledgers and calculate latency and fee metrics')
  .option('-r, --rpc-url <url>', 'Soroban / Horizon RPC URL', 'https://horizon-testnet.stellar.org')
  .option('-l, --ledgers <count>', 'Number of ledgers to sample', '10')
  .option('-j, --json-out <path>', 'Output JSON file path')
  .action(async (options) => {
    try {
      const ledgersCount = parseInt(options.ledgers, 10);
      if (isNaN(ledgersCount) || ledgersCount <= 0) {
        console.error('Error: --ledgers option must be a positive integer.');
        process.exit(1);
      }

      console.log(`Sampling ${ledgersCount} ledgers from ${options.rpcUrl}...`);
      const samples = await fetchLedgerSamples(options.rpcUrl, ledgersCount);
      const metrics = calculateMetrics(samples, options.rpcUrl);

      const summaryText = formatMetricsSummary(metrics);
      console.log(summaryText);

      if (options.jsonOut) {
        writeMetricsToJson(metrics, options.jsonOut);
        console.log(`Saved JSON metrics report to ${options.jsonOut}`);
      }
    } catch (err: any) {
      console.error(`Error executing latency fee tracker: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
