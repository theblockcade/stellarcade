#!/usr/bin/env node

import * as fs from 'fs';
import { Command } from 'commander';
import { exportAuditLog } from './exporter';
import type { AuditRecord, ExportFormat } from '../types';

const program = new Command();

program
  .name('audit-log-exporter')
  .description('Filter and export database audit log records to encrypted CSV / JSON compliance packages')
  .version('0.0.1')
  .requiredOption('--input <path>', 'Path to a JSON array file of audit records')
  .requiredOption('--format <format>', 'Output format: csv | json')
  .option('--actor <actor>', 'Filter by actor')
  .option('--action <action>', 'Filter by action type')
  .option('--start <date>', 'Inclusive ISO-8601 start date filter')
  .option('--end <date>', 'Inclusive ISO-8601 end date filter')
  .option('--encrypt <password>', 'Encrypt output with AES-256-GCM using this password')
  .option('--out <path>', 'Output file path (defaults to stdout)')
  .action((options) => {
    const format = options.format as string;
    if (format !== 'csv' && format !== 'json') {
      console.error('Error: --format must be "csv" or "json"');
      process.exitCode = 2;
      return;
    }

    if (!fs.existsSync(options.input)) {
      console.error(`Error: File not found: ${options.input}`);
      process.exitCode = 2;
      return;
    }

    let records: AuditRecord[];
    try {
      const raw = fs.readFileSync(options.input, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('--input file must contain a JSON array of audit records');
      }
      records = parsed;
    } catch (err) {
      console.error(`Error: invalid --input file: ${(err as Error).message}`);
      process.exitCode = 2;
      return;
    }

    const result = exportAuditLog(records, {
      format: format as ExportFormat,
      filter: {
        actor: options.actor,
        action: options.action,
        startDate: options.start,
        endDate: options.end,
      },
      encryptPassword: options.encrypt,
    });

    const output =
      typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);

    if (options.out) {
      fs.writeFileSync(options.out, output, 'utf8');
      fs.writeFileSync(`${options.out}.manifest.json`, JSON.stringify(result.manifest, null, 2), 'utf8');
      console.log(`Exported ${result.manifest.recordCount} record(s) to ${options.out}`);
      console.log(`Manifest: ${options.out}.manifest.json`);
    } else {
      console.log(output);
      console.error(`\n# manifest: ${JSON.stringify(result.manifest)}`);
    }

    process.exitCode = 0;
  });

if (require.main === module) {
  program.parse(process.argv);
}

export { exportAuditLog } from './exporter';
export * from '../types';
