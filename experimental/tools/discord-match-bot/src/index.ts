#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { EmbedBuilder } from './embed-builder';
import { EventListener } from './event-listener';
import type { BotConfig, DiscordEmbed, MatchResult } from './types';

function loadConfigFromEnv(): BotConfig {
  const minAnnounceWager = Number(process.env.MIN_ANNOUNCE_WAGER ?? '100');
  return {
    botToken: process.env.DISCORD_BOT_TOKEN ?? '',
    channelId: process.env.CHANNEL_ID ?? '',
    backendWsUrl: process.env.BACKEND_WS_URL ?? '',
    minAnnounceWager: Number.isFinite(minAnnounceWager) ? minAnnounceWager : 100,
    webhookUrl: process.env.WEBHOOK_URL,
  };
}

function main(): void {
  const program = new Command();
  program
    .name('discord-match-bot')
    .description('Announces StellarCade match results to Discord')
    .version('0.0.1')
    .option('--min-wager <number>', 'Minimum wager to announce (overrides env)', Number)
    .option('--webhook-url <url>', 'Discord webhook URL (overrides env)')
    .parse(process.argv);

  const opts = program.opts();
  const config = loadConfigFromEnv();

  if (opts.minWager !== undefined) {
    config.minAnnounceWager = opts.minWager;
  }
  if (opts.webhookUrl) {
    config.webhookUrl = opts.webhookUrl;
  }

  if (!config.botToken && !config.webhookUrl) {
    console.error(
      chalk.red('No Discord credentials configured.'),
      'Set DISCORD_BOT_TOKEN+CHANNEL_ID or WEBHOOK_URL.',
    );
    process.exitCode = 1;
    return;
  }

  const embedBuilder = new EmbedBuilder();

  const onMatchSettled = (embed: DiscordEmbed): void => {
    console.log(chalk.green('Match announced:'), embed.title);
  };

  const listener = new EventListener(config, onMatchSettled);
  listener.start();

  console.log(chalk.cyan('Discord Match Bot started'));
  console.log(chalk.gray(`  Channel: ${config.channelId || 'webhook'}`));
  console.log(chalk.gray(`  Min wager: ${config.minAnnounceWager} XLM`));
  console.log(chalk.gray(`  Backend: ${config.backendWsUrl}`));

  const shutdown = (): void => {
    console.log(chalk.yellow('\nShutting down...'));
    listener.stop();
    process.exitCode = 0;
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  main();
}

export { loadConfigFromEnv };
