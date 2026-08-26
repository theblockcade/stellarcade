import chalk from 'chalk';
import type { WasmAnalysisResult } from './types';

export class ReportGenerator {
  private result: WasmAnalysisResult;
  private warnThresholdKb: number;

  constructor(result: WasmAnalysisResult, warnThresholdKb: number = 64) {
    this.result = result;
    this.warnThresholdKb = warnThresholdKb;
  }

  printTerminal(): void {
    const { result } = this;

    console.log(chalk.bold('\n=== WASM Size Analysis ===\n'));
    console.log(chalk.white(`File: ${result.filePath}`));
    console.log(chalk.white(`Total size: ${this.formatBytes(result.totalSize)}`));
    console.log('');

    console.log(chalk.bold('Section Breakdown:'));
    console.log(chalk.gray('-'.repeat(60)));
    console.log(
      chalk.bold(
        'Section'.padEnd(20) +
          'Size (bytes)'.padEnd(15) +
          'Size (KB)'.padEnd(12) +
          '% of Total'
      )
    );
    console.log(chalk.gray('-'.repeat(60)));

    for (const section of result.sections) {
      const pct = result.totalSize > 0 ? (section.size / result.totalSize) * 100 : 0;
      const color = this.getSectionColor(section.size, result.totalSize);

      console.log(
        color(
          section.name.padEnd(20) +
            section.size.toString().padEnd(15) +
            (section.size / 1024).toFixed(2).padEnd(12) +
            pct.toFixed(1) + '%'
        )
      );
    }

    console.log(chalk.gray('-'.repeat(60)));
    console.log('');

    if (result.warnings.length > 0) {
      console.log(chalk.yellow.bold('Warnings:'));
      for (const warning of result.warnings) {
        console.log(chalk.yellow(`  - ${warning}`));
      }
      console.log('');
    }

    if (result.recommendations.length > 0) {
      console.log(chalk.cyan.bold('Recommendations:'));
      for (const rec of result.recommendations) {
        console.log(chalk.cyan(`  - ${rec}`));
      }
      console.log('');
    }
  }

  printJson(): void {
    console.log(JSON.stringify(this.result, null, 2));
  }

  getSectionColor(size: number, total: number): (text: string) => string {
    if (total === 0) {
      return chalk.green;
    }

    const pct = (size / total) * 100;

    if (pct > 50) {
      return chalk.red;
    } else if (pct > 25) {
      return chalk.yellow;
    } else {
      return chalk.green;
    }
  }

  formatBytes(bytes: number): string {
    const kb = bytes / 1024;
    return `${bytes} bytes (${kb.toFixed(2)} KB)`;
  }
}
