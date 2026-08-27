#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { scanWorkspace } from './scanner';
import { buildCallGraphReport, render, renderSummaryTable } from './graph-renderer';
import type { OutputFormat } from './types';

const program = new Command();

program
  .name('call-graph-visualizer')
  .description('Scans Soroban contracts for cross-contract calls and generates a Mermaid/DOT dependency graph')
  .version('0.0.1')
  .option('--contracts-dir <path>', 'Path to the directory of contract crates', 'contracts')
  .option('--format <mermaid|dot>', 'Output diagram format', 'mermaid')
  .option('--out <path>', 'Write the diagram to this file instead of stdout')
  .option('--json', 'Output the raw report as JSON instead of a diagram', false)
  .action(async (options) => {
    const format = validateFormat(options.format);
    const contractsDir = path.resolve(process.cwd(), options.contractsDir);

    const { contracts, edges } = await scanWorkspace(contractsDir);

    if (contracts.length === 0) {
      console.log(chalk.yellow(`No contract crates (directories containing src/lib.rs) found under ${contractsDir}`));
      return;
    }

    const report = buildCallGraphReport(contracts, edges);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    const diagram = render(report, format);

    if (options.out) {
      await fs.writeFile(options.out, diagram, 'utf-8');
      console.log(chalk.gray(`Diagram written to ${options.out}`));
    } else {
      console.log(diagram);
    }

    console.log();
    console.log(chalk.bold('Call Count Summary'));
    console.log(renderSummaryTable(report));

    if (report.isolatedContracts.length > 0) {
      console.log();
      console.log(chalk.yellow(`Isolated contracts (no cross-contract calls detected): ${report.isolatedContracts.join(', ')}`));
    }
  });

function validateFormat(value: string): OutputFormat {
  if (value !== 'mermaid' && value !== 'dot') {
    throw new Error(`Invalid --format "${value}"; expected "mermaid" or "dot".`);
  }
  return value;
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
