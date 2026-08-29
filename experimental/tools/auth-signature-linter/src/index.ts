#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';
import fg from 'fast-glob';
import { scanFunctions } from './ast-scanner';
import { checkAll } from './rules';
import type { LinterConfig, LintResult, Violation } from './types';

const program = new Command();

program
  .name('auth-signature-linter')
  .description('Static analysis linter for missing require_auth() checks on Soroban contract state mutations')
  .version('0.0.1')
  .requiredOption('--contracts-dir <path>', 'Directory to scan for lib.rs files (recursively)')
  .option('--fail-on-warning', 'Exit 1 if any violation is found', false)
  .action((options) => {
    const config: LinterConfig = {
      contractsDir: options.contractsDir,
      failOnWarning: options.failOnWarning,
    };

    if (!fs.existsSync(config.contractsDir)) {
      console.error(`Error: Directory not found: ${config.contractsDir}`);
      process.exitCode = 1;
      return;
    }

    const result = lintDirectory(config.contractsDir);
    printReport(result);

    if (result.violations.length > 0 && config.failOnWarning) {
      process.exitCode = 1;
    }
  });

/** Lint every `lib.rs` (Soroban contracts' conventional entry point) under `contractsDir`. */
export function lintDirectory(contractsDir: string): LintResult {
  const files = fg.sync('**/src/lib.rs', { cwd: contractsDir, absolute: true });

  let functionsScanned = 0;
  const violations: Violation[] = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(contractsDir, file);
    const functions = scanFunctions(source, relativePath);
    functionsScanned += functions.length;
    violations.push(...checkAll(functions));
  }

  return { filesScanned: files.length, functionsScanned, violations };
}

function printReport(result: LintResult): void {
  console.log(chalk.bold('\n=== Auth Signature Lint ===\n'));
  console.log(`Scanned ${result.filesScanned} file(s), ${result.functionsScanned} function(s).\n`);

  if (result.violations.length === 0) {
    console.log(chalk.green('✓ No missing require_auth() checks found.\n'));
    return;
  }

  console.log(chalk.red.bold(`${result.violations.length} violation(s) found:\n`));
  for (const v of result.violations) {
    console.log(chalk.red(`  ✗ ${v.filePath}:${v.line} — ${v.message}`));
    console.log(chalk.gray(`    ${v.remediation}`));
  }
  console.log('');
}

if (require.main === module) {
  program.parse();
}
