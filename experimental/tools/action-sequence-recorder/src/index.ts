#!/usr/bin/env node

import { Command } from 'commander';
import {
  generateMockActions,
  createSession,
  saveSessionToFile,
  loadSessionFromFile,
} from './recorder.js';
import { replaySession, type PlaybackSpeed } from './player.js';

const program = new Command();

program
  .name('action-sequence-recorder')
  .description('Record and replay arcade game action sequences for QA testing')
  .version('0.0.1');

program
  .command('record')
  .description('Record a new action sequence session (generates mock data for experimental use)')
  .requiredOption('--game-id <id>', 'Game identifier (e.g. "space-invaders")')
  .option('--out <path>', 'Output session file path', './session.json.gz')
  .option('--actions <count>', 'Number of mock actions to generate', '50')
  .action((opts: { gameId: string; out: string; actions: string }) => {
    const count = parseInt(opts.actions, 10);
    if (isNaN(count) || count <= 0) {
      console.error('Error: --actions must be a positive integer');
      process.exit(1);
    }

    console.log(`Recording ${count} actions for game "${opts.gameId}"...`);

    const actions = generateMockActions(count);
    const session = createSession(opts.gameId, actions, {
      mockMode: true,
      generatedAt: new Date().toISOString(),
    });

    saveSessionToFile(session, opts.out);

    const totalDuration = session.metadata.totalDurationMs as number;
    console.log(`Session saved to ${opts.out}`);
    console.log(`  Actions recorded: ${actions.length}`);
    console.log(`  Total duration:   ${totalDuration}ms`);
    console.log(`  Compressed:       ${(Buffer.byteLength(JSON.stringify(session)) / 1024).toFixed(1)}KB uncompressed`);
  });

program
  .command('replay')
  .description('Replay a recorded action sequence session')
  .requiredOption('--file <path>', 'Path to the session file (.json.gz)')
  .option('--speed <speed>', 'Playback speed: 1x, 2x, or max', '1x')
  .action((opts: { file: string; speed: string }) => {
    const validSpeeds: PlaybackSpeed[] = ['1x', '2x', 'max'];
    const speed = opts.speed as PlaybackSpeed;
    if (!validSpeeds.includes(speed)) {
      console.error(`Error: --speed must be one of: ${validSpeeds.join(', ')}`);
      process.exit(1);
    }

    console.log(`Loading session from ${opts.file}...`);

    const session = loadSessionFromFile(opts.file);
    console.log(`  Game:     ${session.gameId}`);
    console.log(`  Recorded: ${session.recordedAt}`);
    console.log(`  Actions:  ${session.actions.length}`);

    console.log(`\nReplaying at ${speed} speed...`);

    const result = replaySession(session, speed);

    for (const step of result.steps) {
      console.log(
        `  [${String(step.index + 1).padStart(4)}] ${step.action.type.padEnd(18)} ` +
        `hash=${step.stateHash} elapsed=${step.elapsed.toFixed(0)}ms`
      );
    }

    console.log(`\nReplay complete.`);
    console.log(`  Total steps:     ${result.steps.length}`);
    console.log(`  Final hash:      ${result.finalStateHash}`);
    console.log(`  Original hash:   ${result.originalStateHash}`);
    console.log(`  Deterministic:   ${result.deterministic ? 'YES' : 'NO'}`);

    if (!result.deterministic) {
      console.error(`  Divergence at step: ${result.divergencePoint}`);
      process.exit(1);
    }
  });

program.parse();
