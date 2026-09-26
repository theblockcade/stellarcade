#!/usr/bin/env node

import * as fs from 'fs';
import { Command } from 'commander';
import { verifyRound, verifyBatch, formatVerification, formatBatchSummary } from './verifier';
import type { BatchLogEntry, GameKind } from '../types';

const VALID_GAMES: GameKind[] = ['coinflip', 'dice', 'roulette'];

const program = new Command();

program
  .name('seed-verifier-cli')
  .description('Offline provably-fair seed and roll verification for coinflip, dice, and roulette rounds')
  .version('0.0.1');

program
  .command('verify')
  .description('Verify a single round from raw seed parameters')
  .requiredOption('--server-seed <seed>', 'Revealed server seed')
  .requiredOption('--client-seed <seed>', 'Client seed')
  .requiredOption('--nonce <n>', 'Round nonce')
  .requiredOption('--game <game>', 'Game type: coinflip | dice | roulette')
  .option('--commitment <hash>', 'Expected SHA-256 commitment of the server seed')
  .option('--expected <result>', 'Expected result to compare against, e.g. heads, 42, 17')
  .option('--json', 'Output raw JSON instead of formatted text', false)
  .action((options) => {
    const game = options.game as string;
    if (!VALID_GAMES.includes(game as GameKind)) {
      console.error(`Error: --game must be one of ${VALID_GAMES.join(', ')}`);
      process.exitCode = 2;
      return;
    }

    const nonce = parseInt(options.nonce, 10);
    if (Number.isNaN(nonce)) {
      console.error('Error: --nonce must be an integer');
      process.exitCode = 2;
      return;
    }

    const result = verifyRound(
      {
        serverSeed: options.serverSeed,
        clientSeed: options.clientSeed,
        nonce,
        game: game as GameKind,
        commitment: options.commitment,
      },
      options.expected
    );

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatVerification(result));
    }

    process.exitCode = result.passed ? 0 : 1;
  });

program
  .command('batch <file>')
  .description('Verify a batch of rounds from a JSON log file (array of round entries)')
  .option('--json', 'Output raw JSON instead of formatted text', false)
  .action((file: string, options) => {
    if (!fs.existsSync(file)) {
      console.error(`Error: File not found: ${file}`);
      process.exitCode = 2;
      return;
    }

    let entries: BatchLogEntry[];
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Log file must contain a JSON array of round entries');
      }
      entries = parsed;
    } catch (err) {
      console.error(`Error: invalid log file: ${(err as Error).message}`);
      process.exitCode = 2;
      return;
    }

    const batch = verifyBatch(entries);

    if (options.json) {
      console.log(JSON.stringify(batch, null, 2));
    } else {
      console.log(formatBatchSummary(batch));
    }

    process.exitCode = batch.failed === 0 ? 0 : 1;
  });

if (require.main === module) {
  program.parse(process.argv);
}

export { verifyRound, verifyBatch } from './verifier';
export * from '../types';
