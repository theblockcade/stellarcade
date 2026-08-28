#!/usr/bin/env node
import { Command } from 'commander';
import type { NotifierConfig } from './types.js';
import { startPolling } from './event-poller.js';
import { notifyJackpotWin, RateLimiter } from './telegram-client.js';

function loadConfig(): NotifierConfig {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  const rpcUrl = process.env.RPC_URL;

  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
  if (!chatId) throw new Error('CHAT_ID is required');
  if (!rpcUrl) throw new Error('RPC_URL is required');

  return {
    telegramBotToken: token,
    chatId,
    rpcUrl,
    minNotifyAmount: parseFloat(process.env.MIN_NOTIFY_AMOUNT ?? '100'),
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS ?? '15000', 10),
  };
}

const program = new Command();

program
  .name('telegram-jackpot-notifier')
  .description('Telegram bot worker that broadcasts arcade jackpot wins and big wagers')
  .option('--dry-run', 'Print formatted messages to stdout instead of sending', false)
  .action(async (options) => {
    try {
      const config = loadConfig();
      const rateLimiter = new RateLimiter(25); // 25 msg/sec, well under Telegram's 30/sec limit

      if (options.dryRun) {
        console.log('[dry-run] Would start polling for jackpot events');
        console.log(`  RPC URL: ${config.rpcUrl}`);
        console.log(`  Chat ID: ${config.chatId}`);
        console.log(`  Min amount: ${config.minNotifyAmount} XLM`);
        console.log(`  Poll interval: ${config.pollIntervalMs}ms`);

        // Send a test message to verify formatting
        const { formatJackpotMessage } = await import('./telegram-client.js');
        const testEvent = {
          winnerAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
          winnerHandle: 'arcade_champ',
          prizeAmount: 1250.5,
          gameTitle: 'Coin Flip Ultra',
          txHash: 'abc123def456789',
        };
        console.log('\n--- Sample message ---');
        console.log(formatJackpotMessage(testEvent));
        console.log('--- End ---');
        return;
      }

      console.log('Starting Telegram jackpot notifier...');
      console.log(`  Chat ID: ${config.chatId}`);
      console.log(`  Min amount: ${config.minNotifyAmount} XLM`);
      console.log(`  Poll interval: ${config.pollIntervalMs}ms`);

      const { stop } = startPolling(config, async (event) => {
        console.log(
          `[notify] ${event.gameTitle}: ${event.prizeAmount} XLM → ${event.winnerAddress}`,
        );
        await notifyJackpotWin(
          config.telegramBotToken,
          config.chatId,
          event,
          rateLimiter,
        );
      });

      // Graceful shutdown
      const shutdown = () => {
        console.log('\nShutting down...');
        stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      console.log('Listening for jackpot events... (Ctrl+C to stop)');
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
