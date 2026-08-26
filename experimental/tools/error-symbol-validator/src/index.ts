#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { SymbolExtractor } from './extractor';
import { SymbolComparator } from './comparator';
import type { SdkMapping, ValidatorConfig } from './types';

const program = new Command();

program
  .name('error-symbol-validator')
  .description('Validate that all contract error symbols are mapped in the typed SDK')
  .version('0.0.1');

program
  .option('--contracts-dir <path>', 'Path to contracts source directory', './contracts')
  .option('--sdk-dir <path>', 'Path to SDK package directory', './packages/typed-api-sdk')
  .option('--export-markdown <path>', 'Export validation report as markdown to this path')
  .action((options) => {
    const config: ValidatorConfig = {
      contractsDir: options.contractsDir,
      sdkDir: options.sdkDir,
      exportMarkdown: options.exportMarkdown,
    };

    console.log(chalk.bold('Error Symbol Validator'));
    console.log(chalk.gray(`Contracts: ${config.contractsDir}`));
    console.log(chalk.gray(`SDK: ${config.sdkDir}`));
    console.log('');

    const extractor = new SymbolExtractor(config.contractsDir);
    const contractSymbols = extractor.extractAll();

    console.log(chalk.cyan(`Found ${contractSymbols.length} error symbols in contracts`));

    const sdkMappings = extractSdkMappings(config.sdkDir);
    console.log(chalk.cyan(`Found ${sdkMappings.length} mappings in SDK`));
    console.log('');

    const comparator = new SymbolComparator(contractSymbols, sdkMappings);
    const discrepancies = comparator.compare();
    const summary = comparator.getSummary();

    if (discrepancies.length === 0) {
      console.log(chalk.green(`All ${summary.total} symbols are properly mapped.`));
    } else {
      console.log(chalk.red(`${discrepancies.length} discrepancy(ies) found:`));
      console.log('');
      for (const disc of discrepancies) {
        const label =
          disc.status === 'missing_in_sdk'
            ? chalk.red('MISSING IN SDK')
            : disc.status === 'missing_in_contract'
            ? chalk.yellow('MISSING IN CONTRACT')
            : chalk.magenta('MESSAGE MISMATCH');
        console.log(`  ${label}  ${chalk.bold(disc.symbol)}`);
        if (disc.contractSource) console.log(`    Contract: ${disc.contractSource}`);
        if (disc.sdkSource) console.log(`    SDK: ${disc.sdkSource}`);
        if (disc.contractMessage && disc.sdkMessage) {
          console.log(`    Contract msg: ${disc.contractMessage}`);
          console.log(`    SDK msg: ${disc.sdkMessage}`);
        }
      }
    }

    console.log('');
    console.log(
      chalk.gray(
        `Summary: ${summary.matched}/${summary.total} matched, ${summary.mismatched} discrepancies`
      )
    );

    if (config.exportMarkdown) {
      const md = comparator.exportMarkdown();
      fs.writeFileSync(config.exportMarkdown, md, 'utf-8');
      console.log(chalk.green(`Markdown report written to ${config.exportMarkdown}`));
    }

    if (discrepancies.length > 0) {
      process.exitCode = 1;
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

function extractSdkMappings(sdkDir: string): SdkMapping[] {
  const mappings: SdkMapping[] = [];
  if (!fs.existsSync(sdkDir)) return mappings;

  const files = findTsFiles(sdkDir);
  const symbolRegex = /['"]?(\w+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
  const patternRegex = /(?:ERROR_|error_)\w+/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    const symbolMatches = content.matchAll(
      /(\w+)\s*:\s*['"]([^'"]+)['"]/g
    );
    for (const match of symbolMatches) {
      const key = match[1];
      const value = match[2];
      if (key === key.toUpperCase() && key.includes('ERROR')) {
        const lineNumber = content.slice(0, match.index).split('\n').length;
        mappings.push({
          symbol: key,
          message: value,
          source: file,
          lineNumber,
        });
      }
    }

    const errorVarMatches = content.matchAll(
      /(?:const|let|var)\s+(ERR_\w+)\s*=\s*['"]([^'"]+)['"]/g
    );
    for (const match of errorVarMatches) {
      const varName = match[1];
      const message = match[2];
      const lineNumber = content.slice(0, match.index).split('\n').length;
      mappings.push({
        symbol: varName,
        message,
        source: file,
        lineNumber,
      });
    }

    const enumErrorMatches = content.matchAll(
      /(\w+)\s*=\s*['"]([\w\s]+)['"]/g
    );
    for (const match of enumErrorMatches) {
      if (match.index === undefined) continue;
      const key = match[1];
      const value = match[2];
      const precedingContent = content.slice(Math.max(0, match.index - 200), match.index);
      if (precedingContent.includes('Error') || precedingContent.includes('error')) {
        const alreadyMapped = mappings.some(m => m.symbol === key);
        if (!alreadyMapped) {
          const lineNumber = content.slice(0, match.index).split('\n').length;
          mappings.push({
            symbol: key,
            message: value,
            source: file,
            lineNumber,
          });
        }
      }
    }
  }

  return mappings;
}

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = path.join(entry.parentPath ?? entry.path, entry.name);
    if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}
