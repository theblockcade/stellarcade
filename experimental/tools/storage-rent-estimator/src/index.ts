#!/usr/bin/env node

import { promises as fs } from 'fs';
import { Command } from 'commander';
import chalk from 'chalk';
import { buildStorageAnalysisReport, DEFAULT_RENT_PARAMS } from './cost-model';
import type { StorageAnalysisReport, StorageEntry } from './types';

const program = new Command();

program
  .name('storage-rent-estimator')
  .description('Contract storage footprint and rent cost estimator for Soroban contracts')
  .version('0.0.1');

program
  .command('analyze')
  .description('Analyze storage footprint and project rent costs for a contract')
  .requiredOption('--contract-id <id>', 'Soroban contract ID to analyze')
  .option('--rpc-url <url>', 'Soroban RPC URL', 'https://soroban-testnet.stellar.org')
  .option('--target-ttl-ledgers <n>', 'Target TTL extension window, in ledgers', '535680') // ~31 days
  .option('--output <path>', 'Write a markdown report to this path in addition to stdout')
  .option('--entries-file <path>', 'Path to a JSON file of storage entries (bypasses --rpc-url fetch)')
  .option('--json', 'Output raw JSON instead of a formatted table', false)
  .action(async (options) => {
    const targetTtlLedgers = parseInt(options.targetTtlLedgers, 10);

    const entries = options.entriesFile
      ? await loadEntriesFromFile(options.entriesFile)
      : await fetchStorageEntries(options.contractId, options.rpcUrl);

    const report = buildStorageAnalysisReport(
      options.contractId,
      entries,
      targetTtlLedgers,
      DEFAULT_RENT_PARAMS
    );

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }

    if (options.output) {
      await fs.writeFile(options.output, toMarkdownReport(report), 'utf-8');
      console.log(chalk.gray(`\nMarkdown report written to ${options.output}`));
    }
  });

async function loadEntriesFromFile(path: string): Promise<StorageEntry[]> {
  const raw = await fs.readFile(path, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected ${path} to contain a JSON array of storage entries`);
  }
  return parsed as StorageEntry[];
}

/**
 * Fetches storage entries for a contract via the Soroban RPC
 * `getLedgerEntries` family of calls. Not implemented against a live
 * network in this environment (no RPC access available while
 * developing/reviewing this tool) — returns an empty entry list so the
 * report gracefully renders as "no storage" rather than crashing. Use
 * `--entries-file` to supply real/exported entries in the meantime.
 */
async function fetchStorageEntries(_contractId: string, _rpcUrl: string): Promise<StorageEntry[]> {
  console.log(
    chalk.yellow(
      '⚠ Live RPC storage fetching is not implemented yet; pass --entries-file <path> ' +
        'with exported storage entries, or see README for the expected JSON shape.'
    )
  );
  return [];
}

function printReport(report: StorageAnalysisReport): void {
  console.log(chalk.blue('📦 Storage Rent Estimator'));
  console.log(chalk.gray(`Contract ID: ${report.contractId}`));
  console.log(chalk.gray(`Target TTL: ${report.targetTtlLedgers} ledgers`));
  console.log();

  console.log(chalk.bold('Entry Counts'));
  console.log(chalk.gray(`  Instance:   ${report.entryCounts.instance}`));
  console.log(chalk.gray(`  Persistent: ${report.entryCounts.persistent}`));
  console.log(chalk.gray(`  Temporary:  ${report.entryCounts.temporary}`));
  console.log();

  console.log(chalk.bold('Total Size (bytes)'));
  console.log(chalk.gray(`  Instance:   ${report.totalSizeBytes.instance}`));
  console.log(chalk.gray(`  Persistent: ${report.totalSizeBytes.persistent}`));
  console.log(chalk.gray(`  Temporary:  ${report.totalSizeBytes.temporary}`));
  console.log();

  if (report.entries.length === 0) {
    console.log(chalk.gray('No storage entries found.'));
    return;
  }

  console.log(chalk.bold('Projected Rent'));
  console.log(
    chalk.green(
      `  Monthly: ${report.projectedMonthlyRentStroops.toFixed(0)} stroops ` +
        `(${report.projectedMonthlyRentLumens.toFixed(7)} XLM)`
    )
  );
  console.log(
    chalk.green(
      `  Annual:  ${report.projectedAnnualRentStroops.toFixed(0)} stroops ` +
        `(${report.projectedAnnualRentLumens.toFixed(7)} XLM)`
    )
  );
  console.log(
    chalk.gray(
      `  TTL extension cost (all entries): ${report.totalExtensionCostStroops.toFixed(0)} stroops ` +
        `(${report.totalExtensionCostLumens.toFixed(7)} XLM)`
    )
  );
}

function toMarkdownReport(report: StorageAnalysisReport): string {
  const lines: string[] = [];
  lines.push(`# Storage Rent Analysis: \`${report.contractId}\``);
  lines.push('');
  lines.push(`Target TTL: **${report.targetTtlLedgers} ledgers**`);
  lines.push('');
  lines.push('## Entry Counts');
  lines.push('');
  lines.push('| Durability | Count | Total Size (bytes) |');
  lines.push('|---|---|---|');
  lines.push(`| Instance | ${report.entryCounts.instance} | ${report.totalSizeBytes.instance} |`);
  lines.push(`| Persistent | ${report.entryCounts.persistent} | ${report.totalSizeBytes.persistent} |`);
  lines.push(`| Temporary | ${report.entryCounts.temporary} | ${report.totalSizeBytes.temporary} |`);
  lines.push('');
  lines.push('## Projected Rent');
  lines.push('');
  lines.push(`- Monthly: ${report.projectedMonthlyRentStroops.toFixed(0)} stroops (${report.projectedMonthlyRentLumens.toFixed(7)} XLM)`);
  lines.push(`- Annual: ${report.projectedAnnualRentStroops.toFixed(0)} stroops (${report.projectedAnnualRentLumens.toFixed(7)} XLM)`);
  lines.push('');

  if (report.entries.length > 0) {
    lines.push('## Per-Entry Breakdown');
    lines.push('');
    lines.push('| Key | Durability | Size (bytes) | Extension Cost (stroops) |');
    lines.push('|---|---|---|---|');
    for (const entry of report.entries) {
      lines.push(
        `| ${entry.key} | ${entry.durability} | ${entry.sizeBytes} | ${entry.extensionCostStroops.toFixed(0)} |`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
