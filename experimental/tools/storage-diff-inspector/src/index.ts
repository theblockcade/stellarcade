import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { diffStorageEntries } from './diff-engine';
import { formatDiffAnsi, formatDiffHtml, formatDiffMarkdown } from './formatter';
import { CliUsageError, resolveSnapshotPair } from './cli';

const program = new Command();

program
  .name('storage-diff-inspector')
  .description("Diffs two Soroban contract storage snapshots and reports added/removed/modified keys")
  .option('-c, --contract-id <id>', 'Soroban contract ID (used with --before-ledger/--after-ledger)')
  .option('--before-ledger <n>', 'Ledger sequence number for the "before" snapshot')
  .option('--after-ledger <m>', 'Ledger sequence number for the "after" snapshot')
  .option('--before-file <path>', 'Path to a JSON file containing the "before" snapshot entries')
  .option('--after-file <path>', 'Path to a JSON file containing the "after" snapshot entries')
  .option('-r, --rpc-url <url>', 'Soroban RPC URL', 'https://soroban-testnet.stellar.org')
  .option('-f, --format <format>', 'Report format for --out: ansi | markdown | html', 'ansi')
  .option('-o, --out <path>', 'Write the report to this file instead of stdout')
  .action((options) => {
    try {
      if (options.beforeLedger && options.afterLedger && !(options.beforeFile && options.afterFile)) {
        console.log(
          `[Info] Querying Soroban RPC ${options.rpcUrl} for contract ${options.contractId} ` +
            `at ledgers ${options.beforeLedger} and ${options.afterLedger}...`,
        );
      }

      const { before, after } = resolveSnapshotPair(options);
      const result = diffStorageEntries(before, after);

      const format = (options.format || 'ansi').toLowerCase();
      let outputContent: string;
      if (format === 'markdown') {
        outputContent = formatDiffMarkdown(result);
      } else if (format === 'html') {
        outputContent = formatDiffHtml(result);
      } else {
        outputContent = formatDiffAnsi(result);
      }

      if (options.out) {
        const outPath = path.resolve(options.out);
        const outDir = path.dirname(outPath);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        fs.writeFileSync(outPath, outputContent, 'utf8');
        console.log(`Wrote ${format} storage diff report (${result.entries.length} changes) -> ${outPath}`);
      } else {
        console.log(outputContent);
      }
    } catch (err: any) {
      if (err instanceof CliUsageError) {
        console.error(`Error: ${err.message}`);
      } else {
        console.error(`Error diffing contract storage snapshots: ${err.message}`);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
