#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import {
  buildReplaySteps,
  findMatch,
  MatchNotFoundError,
  parseMatchHistory,
  UnsupportedGameTypeError,
} from './replayer';
import { ReplayCursor, renderFrame } from './ui';
import type { MatchRecord } from './types';

const program = new Command();

program
  .name('match-replay-visualizer')
  .description('Interactive TUI to step through historical arcade match move sequences')
  .version('0.0.1')
  .requiredOption('--match-id <id>', 'Match ID to replay')
  .option('--rpc-url <url>', 'Soroban RPC URL', 'http://localhost:8000')
  .option(
    '--fixtures <path>',
    'Path to a JSON file of match records to load instead of querying RPC (for local testing)',
  )
  .option('--auto-play', 'Automatically step through the whole match', false)
  .option('--auto-play-interval-ms <ms>', 'Delay between auto-play steps', '800');

program.parse(process.argv);
const options = program.opts();

/**
 * Fetches match records. When `--fixtures` is provided, reads them from a
 * local JSON file (used for tests and offline debugging); otherwise this is
 * where a real deployment would query the configured Soroban RPC endpoint
 * for the match's transaction/event history.
 */
async function loadMatches(fixturesPath: string | undefined, rpcUrl: string): Promise<unknown[]> {
  if (fixturesPath) {
    const raw = fs.readFileSync(fixturesPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  throw new Error(
    `Live RPC lookup against ${rpcUrl} is not implemented in this prototype — pass --fixtures <path> for local testing.`,
  );
}

async function main(): Promise<void> {
  let rawMatches: unknown[];
  try {
    rawMatches = await loadMatches(options.fixtures, options.rpcUrl);
  } catch (err) {
    console.error(chalk.red(`Failed to load match data: ${(err as Error).message}`));
    process.exitCode = 1;
    return;
  }

  const records: MatchRecord[] = [];
  for (const raw of rawMatches) {
    try {
      const { record, warnings } = parseMatchHistory(raw);
      warnings.forEach((w) => console.warn(chalk.yellow(`Warning: ${w}`)));
      records.push(record);
    } catch (err) {
      if (err instanceof UnsupportedGameTypeError) {
        console.warn(chalk.yellow(`Skipping match: ${err.message}`));
        continue;
      }
      throw err;
    }
  }

  let match: MatchRecord;
  try {
    match = findMatch(records, options.matchId);
  } catch (err) {
    if (err instanceof MatchNotFoundError) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
      return;
    }
    throw err;
  }

  if (!match.outcome && !options.autoPlay) {
    // Not a hard failure — an in-progress match can still be replayed up to
    // its latest known move — but warn clearly per the acceptance criteria.
    console.warn(
      chalk.yellow(
        `Note: match ${match.matchId} is not yet finalized; replaying up to the latest recorded move.`,
      ),
    );
  }

  const steps = buildReplaySteps(match);
  const cursor = new ReplayCursor(steps);

  if (options.autoPlay) {
    await runAutoPlay(match, cursor, Number(options.autoPlayInterval));
    return;
  }

  runInteractive(match, cursor);
}

async function runAutoPlay(
  match: MatchRecord,
  cursor: ReplayCursor,
  intervalMs: number,
): Promise<void> {
  console.clear();
  console.log(renderFrame(match, cursor));
  while (!cursor.isAtEnd) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    cursor.next();
    console.clear();
    console.log(renderFrame(match, cursor));
  }
}

function runInteractive(match: MatchRecord, cursor: ReplayCursor): void {
  if (!process.stdin.isTTY) {
    // No interactive terminal available (e.g. piped input, CI) — print the
    // full replay non-interactively instead of hanging on keypress input.
    for (let i = 0; i <= cursor.lastIndex; i++) {
      console.log(renderFrame(match, cursor));
      console.log('\n---\n');
      if (i < cursor.lastIndex) {
        cursor.next();
      }
    }
    return;
  }

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  const draw = () => {
    console.clear();
    console.log(renderFrame(match, cursor));
  };

  draw();

  process.stdin.on('data', (key: string) => {
    switch (key) {
      case '[C': // Right arrow
      case ' ':
        cursor.next();
        draw();
        break;
      case '[D': // Left arrow
        cursor.previous();
        draw();
        break;
      case 'e':
        cursor.jumpToEnd();
        draw();
        break;
      case 's':
        cursor.jumpToStart();
        draw();
        break;
      case 'q':
      case '': // Ctrl+C
        process.stdin.setRawMode(false);
        process.exit(0);
        break;
      default:
        break;
    }
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(chalk.red('Fatal error:'), err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}

export { loadMatches };
