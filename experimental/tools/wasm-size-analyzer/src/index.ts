#!/usr/bin/env node

import * as fs from 'fs';
import { Command } from 'commander';
import { WasmAnalyzer } from './analyzer';
import { ReportGenerator } from './reporter';
import type { AnalyzerConfig } from './types';

const program = new Command();

program
  .name('wasm-size-analyzer')
  .description('Soroban WASM binary size analyzer with section breakdown and optimization recommendations')
  .version('0.0.1')
  .requiredOption('--wasm <path>', 'Path to WASM binary file')
  .option('--json', 'Output results as JSON', false)
  .option('--warn-threshold-kb <number>', 'Size warning threshold in KB', '64')
  .action((options) => {
    const wasmPath = options.wasm;

    if (!fs.existsSync(wasmPath)) {
      console.error(`Error: File not found: ${wasmPath}`);
      process.exitCode = 1;
      return;
    }

    const config: AnalyzerConfig = {
      wasmPath,
      jsonOutput: options.json,
      warnThresholdKb: parseInt(options.warnThresholdKb, 10),
    };

    try {
      const analyzer = new WasmAnalyzer(config);
      const result = analyzer.analyze();
      const reporter = new ReportGenerator(result, config.warnThresholdKb);

      if (config.jsonOutput) {
        reporter.printJson();
      } else {
        reporter.printTerminal();
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unexpected error occurred');
      }
      process.exitCode = 1;
    }
  });

if (require.main === module) {
  program.parse();
}
