#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import fg from 'fast-glob';
import { parseEvents } from './event-parser';
import { buildMarkdownCatalog, buildJsonSchema } from './schema-builder';
import type { EventCatalog, GeneratorConfig, OutputFormat } from './types';

const program = new Command();

program
  .name('event-catalog-generator')
  .description('Soroban contract event emission catalog and JSON schema generator')
  .version('0.0.1')
  .option('--contracts-dir <path>', 'Directory to scan for lib.rs files (recursively)', '.')
  .option('--format <format>', 'Output format: markdown or json', 'markdown')
  .option('--out <path>', 'Write output to this file instead of stdout')
  .action((options) => {
    const format = options.format as OutputFormat;
    if (format !== 'markdown' && format !== 'json') {
      console.error(`Error: --format must be 'markdown' or 'json', got '${options.format}'`);
      process.exitCode = 1;
      return;
    }

    const config: GeneratorConfig = {
      contractsDir: options.contractsDir,
      format,
      outPath: options.out,
    };

    if (!fs.existsSync(config.contractsDir)) {
      console.error(`Error: Directory not found: ${config.contractsDir}`);
      process.exitCode = 1;
      return;
    }

    const catalog = generateCatalog(config.contractsDir);
    const output = config.format === 'markdown' ? buildMarkdownCatalog(catalog) : JSON.stringify(buildJsonSchema(catalog), null, 2);

    if (config.outPath) {
      fs.writeFileSync(config.outPath, output);
      console.log(`Catalog written to ${config.outPath}`);
    } else {
      console.log(output);
    }
  });

/** Scan every `lib.rs` under `contractsDir` and build the combined event catalog. */
export function generateCatalog(contractsDir: string): EventCatalog {
  const files = fg.sync('**/src/lib.rs', { cwd: contractsDir, absolute: true });

  const events = files.flatMap((file) => {
    const source = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(contractsDir, file);
    return parseEvents(source, relativePath);
  });

  return { contractsScanned: files.length, events };
}

if (require.main === module) {
  program.parse();
}
