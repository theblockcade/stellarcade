#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { checkAccounts, HORIZON_URLS, loadAddresses, type Network } from './checker';
import type { AccountHealthReport, HealthStatus, RequiredTrustline } from './types';

const program = new Command();

program
  .name('account-hygiene-checker')
  .description('Checks Stellar accounts for reserve health, fee headroom, and required trustlines')
  .version('0.0.1')
  .requiredOption('--addresses <path>', 'Path to a JSON array or newline/CSV file of account addresses')
  .option('--auto-fund', 'Automatically fund unactivated testnet accounts via Friendbot and re-check', false)
  .option('--network <network>', 'testnet or mainnet', 'testnet')
  .option(
    '--required-trustline <code:issuer>',
    'Required asset trustline as CODE:ISSUER (repeatable)',
    collectTrustline,
    [] as RequiredTrustline[]
  )
  .option('--json', 'Output raw JSON instead of a formatted table', false)
  .action(async (options) => {
    const network = validateNetwork(options.network);
    if (options.autoFund && network !== 'testnet') {
      console.error(chalk.red('✗ --auto-fund only works on testnet (Friendbot does not fund mainnet accounts).'));
      process.exitCode = 1;
      return;
    }

    const horizonUrl = HORIZON_URLS[network];
    const addresses = await loadAddresses(options.addresses);

    if (addresses.length === 0) {
      console.log(chalk.yellow('No addresses found in the input file.'));
      return;
    }

    const reports = await checkAccounts(
      addresses,
      horizonUrl,
      options.requiredTrustline,
      { autoFund: Boolean(options.autoFund) },
      (accountId) => console.log(chalk.gray(`Funding ${accountId} via Friendbot...`)),
      (accountId, error) => console.log(chalk.red(`  ✗ Friendbot funding failed for ${accountId}: ${error.message}`))
    );

    if (options.json) {
      console.log(JSON.stringify(reports, null, 2));
    } else {
      printReportTable(reports);
    }

    // Non-zero exit when any account is in danger, so this is usable as
    // a CI/bot gate on account health.
    if (reports.some((r) => r.status === 'danger')) {
      process.exitCode = 1;
    }
  });

function validateNetwork(value: string): Network {
  if (value !== 'testnet' && value !== 'mainnet') {
    throw new Error(`Invalid --network "${value}"; expected "testnet" or "mainnet".`);
  }
  return value;
}

function collectTrustline(value: string, previous: RequiredTrustline[]): RequiredTrustline[] {
  const [assetCode, assetIssuer] = value.split(':');
  if (!assetCode || !assetIssuer) {
    throw new Error(`Invalid --required-trustline "${value}"; expected format CODE:ISSUER.`);
  }
  return [...previous, { assetCode, assetIssuer }];
}

const STATUS_ICON: Record<HealthStatus, string> = {
  healthy: '✓',
  warning: '⚠',
  danger: '✗',
};

function colorForStatus(status: HealthStatus, text: string): string {
  if (status === 'healthy') return chalk.green(text);
  if (status === 'warning') return chalk.yellow(text);
  return chalk.red(text);
}

function printReportTable(reports: AccountHealthReport[]): void {
  console.log(chalk.blue('🩺 Account Hygiene Report'));
  console.log();

  for (const report of reports) {
    const icon = STATUS_ICON[report.status];
    const label = `${icon} ${report.accountId} — ${report.status.toUpperCase()}`;
    console.log(colorForStatus(report.status, label));

    if (!report.activated) {
      console.log(chalk.gray('  Not activated on the network.'));
      console.log();
      continue;
    }

    console.log(
      chalk.gray(
        `  Balance: ${report.nativeBalanceXlm.toFixed(7)} XLM | ` +
          `Min reserve: ${report.minReserveXlm.toFixed(7)} XLM | ` +
          `Spendable: ${report.spendableBalanceXlm.toFixed(7)} XLM | ` +
          `Subentries: ${report.subentryCount}`
      )
    );
    for (const reason of report.reasons) {
      console.log(chalk.gray(`  - ${reason}`));
    }
    console.log();
  }

  const counts = summarizeCounts(reports);
  console.log(chalk.bold('Summary'));
  console.log(
    `  ${chalk.green(`${counts.healthy} healthy`)}, ` +
      `${chalk.yellow(`${counts.warning} warning`)}, ` +
      `${chalk.red(`${counts.danger} danger`)}`
  );
}

function summarizeCounts(reports: AccountHealthReport[]): Record<HealthStatus, number> {
  const counts: Record<HealthStatus, number> = { healthy: 0, warning: 0, danger: 0 };
  for (const report of reports) {
    counts[report.status] += 1;
  }
  return counts;
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
