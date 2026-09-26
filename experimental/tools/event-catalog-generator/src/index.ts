#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { generateMarkdownCatalog, scanContractEvents } from './extractor';

const program = new Command();

program
  .name('event-catalog-generator')
  .description('Extract Soroban contract events and generate Markdown documentation')
  .version('0.0.1')
  .requiredOption('--contracts-dir <path>', 'Directory containing Soroban contract Rust sources')
  .option('--output <path>', 'Output Markdown file path (stdout if omitted)')
  .action((options: { contractsDir?: string; output?: string }) => {
    const dir = options.contractsDir;
    if (!dir) {
      console.error('Error: --contracts-dir is required');
      process.exitCode = 2;
      return;
    }
    if (!fs.existsSync(dir)) {
      console.error(`Error: directory not found: ${dir}`);
      process.exitCode = 2;
      return;
    }

    const rustFiles: string[] = [];
    const walk = (current: string) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.endsWith('.rs')) {
          rustFiles.push(full);
        }
      }
    };
    walk(dir);

    const allEvents = rustFiles.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return scanContractEvents(source);
    });

    const markdown = generateMarkdownCatalog(allEvents);
    if (options.output) {
      fs.writeFileSync(options.output, markdown, 'utf8');
      console.log(`Wrote ${allEvents.length} event(s) to ${options.output}`);
    } else {
      console.log(markdown);
    }
  });

if (require.main === module) {
  program.parseAsync(process.argv);
}

export { scanContractEvents, generateMarkdownCatalog };
export type { ContractEventDef, ContractEventField } from './extractor';
