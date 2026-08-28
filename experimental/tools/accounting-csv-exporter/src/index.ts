#!/usr/bin/env node
import { Command } from 'commander';
import { fetchTransactions, type Transaction } from './tx-fetcher.js';
import { formatCsv } from './csv-formatter.js';
import { writeFileSync } from 'node:fs';

const program = new Command();

program
  .name('accounting-csv-exporter')
  .description('Export StellarCade arcade game transactions to accounting CSV')
  .version('0.0.1')
  .requiredOption('--contract-id <id>', 'Soroban contract ID to filter transactions for')
  .requiredOption('--start-date <YYYY-MM-DD>', 'Start of date range (inclusive, UTC)')
  .requiredOption('--end-date <YYYY-MM-DD>', 'End of date range (inclusive, UTC)')
  .option('--out <path>', 'Output file path (defaults to stdout)')
  .action(async (opts: {
    contractId: string;
    startDate: string;
    endDate: string;
    out?: string;
  }) => {
    try {
      const startDate = parseDate(opts.startDate);
      const endDate = parseDate(opts.endDate);

      if (startDate > endDate) {
        console.error('Error: --start-date must be before --end-date');
        process.exit(1);
      }

      const transactions: Transaction[] = await fetchTransactions({
        contractId: opts.contractId,
        startDate,
        endDate,
      });

      if (transactions.length === 0) {
        console.error('No transactions found for the given filters.');
        process.exit(0);
      }

      const csv = formatCsv(transactions);

      if (opts.out) {
        writeFileSync(opts.out, csv, 'utf-8');
        console.error(`Wrote ${transactions.length} transactions to ${opts.out}`);
      } else {
        process.stdout.write(csv);
      }
    } catch (err) {
      console.error('Fatal error:', err);
      process.exit(1);
    }
  });

function parseDate(input: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) {
    throw new Error(`Invalid date format: ${input}. Expected YYYY-MM-DD.`);
  }
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

program.parse();
