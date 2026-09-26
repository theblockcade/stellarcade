#!/usr/bin/env node

import * as fs from 'fs';
import { Command } from 'commander';
import { ActionRecorder } from './recorder';
import {
  createScoreArcadeEngine,
  formatValidationReport,
  validateReplaySession,
} from './replay-validator';
import type { MatchReplaySession } from './recorder';

const program = new Command();

program
  .name('game-action-recorder')
  .description('Record and validate arcade game action replay sessions')
  .version('0.0.1')
  .option('--validate <file>', 'Validate a replay session JSON file')
  .option('--json', 'Output validation report as JSON', false)
  .action((options: { validate?: string; json?: boolean }) => {
    const file = options.validate;
    if (!file) {
      console.error('Error: pass --validate <file>');
      process.exitCode = 2;
      return;
    }
    if (!fs.existsSync(file)) {
      console.error(`Error: file not found: ${file}`);
      process.exitCode = 2;
      return;
    }
    let session: MatchReplaySession;
    try {
      session = JSON.parse(fs.readFileSync(file, 'utf8')) as MatchReplaySession;
    } catch (err) {
      console.error(`Error: invalid JSON: ${(err as Error).message}`);
      process.exitCode = 2;
      return;
    }
    const engine = createScoreArcadeEngine();
    const result = validateReplaySession(session, engine);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatValidationReport(result));
    }
    process.exitCode = result.valid ? 0 : 1;
  });

if (require.main === module) {
  program.parseAsync(process.argv);
}

export { ActionRecorder, validateReplaySession, createScoreArcadeEngine };
export type { MatchReplaySession } from './recorder';
export type { ReplayValidationResult } from './replay-validator';
export type { GameEngine, RecordedAction } from './recorder';
