import chalk from 'chalk';
import type { ProfileResult, BudgetLevel } from './types';

const LEVEL_COLOR: Record<BudgetLevel, (text: string) => string> = {
  green: chalk.green,
  yellow: chalk.yellow,
  red: chalk.red,
};

export function printTerminal(result: ProfileResult): void {
  const { metrics, utilization } = result;

  console.log(chalk.bold('\n=== CPU Budget Profile ===\n'));
  console.log(chalk.white(`Contract: ${result.contractId}`));
  console.log(chalk.white(`Method:   ${result.method}`));
  console.log('');

  const cpuColor = LEVEL_COLOR[utilization.cpuLevel];
  const memColor = LEVEL_COLOR[utilization.memoryLevel];

  console.log(
    cpuColor(
      `CPU:    ${metrics.cpuInstructions.toLocaleString()} instructions (${utilization.cpuPercent.toFixed(1)}% of budget) [${utilization.cpuLevel.toUpperCase()}]`
    )
  );
  console.log(
    memColor(
      `Memory: ${metrics.memoryBytes.toLocaleString()} bytes (${utilization.memoryPercent.toFixed(1)}% of budget) [${utilization.memoryLevel.toUpperCase()}]`
    )
  );
  console.log('');

  if (result.warnings.length > 0) {
    console.log(chalk.yellow.bold('Warnings:'));
    for (const w of result.warnings) {
      console.log(chalk.yellow(`  - ${w}`));
    }
    console.log('');
  }
}

export function printJson(result: ProfileResult): void {
  console.log(JSON.stringify(result, null, 2));
}

/** Render a one-row markdown benchmark table for `result`, header included. */
export function toMarkdownTable(results: ProfileResult[]): string {
  const header =
    '| Contract | Method | CPU Instructions | CPU % | Memory (bytes) | Memory % | Status |\n' +
    '|---|---|---|---|---|---|---|';

  const rows = results.map((r) => {
    const status = r.utilization.cpuLevel === 'red' || r.utilization.memoryLevel === 'red'
      ? '🔴 Over budget'
      : r.utilization.cpuLevel === 'yellow' || r.utilization.memoryLevel === 'yellow'
        ? '🟡 Approaching limit'
        : '🟢 OK';

    return (
      `| ${r.contractId} | ${r.method} | ${r.metrics.cpuInstructions.toLocaleString()} | ` +
      `${r.utilization.cpuPercent.toFixed(1)}% | ${r.metrics.memoryBytes.toLocaleString()} | ` +
      `${r.utilization.memoryPercent.toFixed(1)}% | ${status} |`
    );
  });

  return [header, ...rows].join('\n');
}
