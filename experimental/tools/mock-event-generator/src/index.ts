#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { emitEvent, EventType } from './emitters';
import type { EventConfig, MockEvent } from './types';

const program = new Command();

program
  .name('mock-event-generator')
  .description('CLI utility for emitting synthetic Soroban contract events')
  .version('0.0.1');

program
  .command('emit')
  .description('Emit mock contract events')
  .option('--event <type>', 'Event type to emit (match_started, wager_deposited, round_settled, jackpot_won)', 'match_started')
  .option('--interval-ms <ms>', 'Interval between events in milliseconds', '2000')
  .option('--count <number>', 'Number of events to emit', '10')
  .option('--rpc-url <url>', 'Soroban RPC URL', 'http://localhost:8000')
  .option('--contract-id <id>', 'Contract ID to emit events for', 'default_contract_id')
  .option('--random', 'Use random payload generation', false)
  .option('--json', 'Output raw JSON instead of formatted text', false)
  .action(async (options) => {
    const config: EventConfig = {
      eventType: options.event as EventType,
      intervalMs: parseInt(options.intervalMs, 10),
      count: parseInt(options.count, 10),
      rpcUrl: options.rpcUrl,
      contractId: options.contractId,
      randomPayload: options.random,
      jsonMode: options.json,
    };

    await emitEvents(config);
  });

program
  .command('stream')
  .description('Continuously stream mock events until interrupted')
  .option('--event <type>', 'Event type to emit (match_started, wager_deposited, round_settled, jackpot_won)', 'match_started')
  .option('--interval-ms <ms>', 'Interval between events in milliseconds', '2000')
  .option('--rpc-url <url>', 'Soroban RPC URL', 'http://localhost:8000')
  .option('--contract-id <id>', 'Contract ID to emit events for', 'default_contract_id')
  .option('--random', 'Use random payload generation', false)
  .option('--json', 'Output raw JSON instead of formatted text', false)
  .action(async (options) => {
    const config: EventConfig = {
      eventType: options.event as EventType,
      intervalMs: parseInt(options.intervalMs, 10),
      count: Infinity,
      rpcUrl: options.rpcUrl,
      contractId: options.contractId,
      randomPayload: options.random,
      jsonMode: options.json,
    };

    await emitEvents(config);
  });

async function emitEvents(config: EventConfig): Promise<void> {
  console.log(chalk.blue('🚀 Mock Event Generator'));
  console.log(chalk.gray(`RPC URL: ${config.rpcUrl}`));
  console.log(chalk.gray(`Contract ID: ${config.contractId}`));
  console.log(chalk.gray(`Event Type: ${config.eventType}`));
  console.log(chalk.gray(`Interval: ${config.intervalMs}ms`));
  console.log(chalk.gray(`Random Payload: ${config.randomPayload ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`Count: ${config.count === Infinity ? '∞ (streaming)' : config.count}`));
  console.log();

  let emittedCount = 0;
  let shouldStop = false;

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Stopping event emission...'));
    shouldStop = true;
  });

  const emitNextEvent = async (): Promise<void> => {
    if (shouldStop || emittedCount >= config.count) {
      console.log(chalk.green(`\n✅ Emitted ${emittedCount} events successfully`));
      process.exit(0);
    }

    try {
      const event: MockEvent = emitEvent(
        config.eventType,
        config.contractId,
        config.randomPayload
      );

      emittedCount++;

      if (config.jsonMode) {
        console.log(JSON.stringify(event, null, 2));
      } else {
        displayEvent(event, emittedCount);
      }

      if (!shouldStop && emittedCount < config.count) {
        setTimeout(emitNextEvent, config.intervalMs);
      } else {
        console.log(chalk.green(`\n✅ Emitted ${emittedCount} events successfully`));
        process.exit(0);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error emitting event: ${error}`));
      process.exit(1);
    }
  };

  await emitNextEvent();
}

function displayEvent(event: MockEvent, count: number): void {
  const eventTypeColors: Record<EventType, string> = {
    match_started: 'cyan',
    wager_deposited: 'green',
    round_settled: 'yellow',
    jackpot_won: 'magenta',
  };

  const color = eventTypeColors[event.type] || 'white';

  console.log(chalk.bold(`[${count}] ${chalk[color](event.type.toUpperCase())}`));
  console.log(chalk.gray(`  Time: ${event.timestamp}`));
  console.log(chalk.gray(`  Contract: ${event.contractId}`));
  console.log(chalk.gray(`  Payload:`));
  
  for (const [key, value] of Object.entries(event.payload)) {
    if (typeof value === 'object' && value !== null) {
      console.log(chalk.gray(`    ${key}:`));
      for (const [subKey, subValue] of Object.entries(value)) {
        console.log(chalk.gray(`      ${subKey}: ${subValue}`));
      }
    } else {
      console.log(chalk.gray(`    ${key}: ${value}`));
    }
  }
  console.log();
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}