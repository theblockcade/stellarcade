#!/usr/bin/env node
import { Command } from 'commander';
import {
  runBenchmark,
  buildReport,
  formatMarkdownSummary,
  writeReportToJson,
  writeMarkdownSummary,
} from './benchmark.js';

const program = new Command();

program
  .name('gas-benchmark-runner')
  .description('Benchmark Soroban contract invocations for gas / latency / resource-fee metrics under simulated load')
  .requiredOption('-c, --contract <id>', 'Contract ID or alias to benchmark')
  .requiredOption('-m, --method <name>', 'Contract method to invoke')
  .option('-i, --iterations <count>', 'Number of invocations to simulate', '100')
  .option('-n, --concurrency <count>', 'Maximum in-flight invocations at a time', '10')
  .option('-r, --rpc-url <url>', 'Soroban RPC URL', 'https://soroban-testnet.stellar.org')
  .option('-o, --output <path>', 'Output JSON report file path (a companion .md summary is also written)')
  .action(async (options) => {
    try {
      const iterations = parseInt(options.iterations, 10);
      if (isNaN(iterations) || iterations <= 0) {
        console.error('Error: --iterations must be a positive integer.');
        process.exit(1);
      }

      const concurrency = parseInt(options.concurrency, 10);
      if (isNaN(concurrency) || concurrency <= 0) {
        console.error('Error: --concurrency must be a positive integer.');
        process.exit(1);
      }

      console.log(
        `Running ${iterations} simulated invocations of ${options.contract}.${options.method} ` +
          `(concurrency: ${concurrency})...`
      );

      const results = await runBenchmark({
        contract: options.contract,
        method: options.method,
        iterations,
        concurrency,
        rpcUrl: options.rpcUrl,
        output: options.output,
      });

      const report = buildReport(
        {
          contract: options.contract,
          method: options.method,
          iterations,
          concurrency,
          rpcUrl: options.rpcUrl,
          output: options.output,
        },
        results
      );

      console.log(formatMarkdownSummary(report));

      if (options.output) {
        writeReportToJson(report, options.output);
        const mdPath = writeMarkdownSummary(report, options.output);
        console.log(`Saved JSON report to ${options.output}`);
        console.log(`Saved Markdown summary to ${mdPath}`);
      }
    } catch (err: any) {
      console.error(`Error running gas benchmark: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
