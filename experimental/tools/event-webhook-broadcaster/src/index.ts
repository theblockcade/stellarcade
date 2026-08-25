#!/usr/bin/env node

import { broadcastEvent } from './broadcaster';
import type { BroadcasterConfig, GameEvent } from './types';

/** Default poll interval when reading events from a JSON feed file. */
const DEFAULT_POLL_INTERVAL_MS = 5000;

/**
 * Builds broadcaster config strictly from environment variables — never
 * from CLI flags — so webhook URLs and bot tokens are never visible in
 * `ps`/shell history.
 */
function loadConfigFromEnv(): BroadcasterConfig {
  const minBroadcastWager = Number(process.env.MIN_BROADCAST_WAGER ?? '100');
  return {
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    minBroadcastWager: Number.isFinite(minBroadcastWager) ? minBroadcastWager : 100,
  };
}

/**
 * Reads newline-delimited JSON game events from a feed file (a stand-in for
 * a real contract event subscription/polling loop, which would live here in
 * a production deployment wired to a Soroban RPC event stream).
 */
async function* readEventFeed(feedPath: string): AsyncGenerator<GameEvent> {
  const fs = await import('fs/promises');
  const raw = await fs.readFile(feedPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      yield JSON.parse(trimmed) as GameEvent;
    } catch {
      console.error(`Skipping malformed event line: ${trimmed}`);
    }
  }
}

async function main(): Promise<void> {
  const feedPath = process.argv[2];
  if (!feedPath) {
    console.error('Usage: event-webhook-broadcaster <path-to-ndjson-event-feed>');
    console.error(
      'Config via env: DISCORD_WEBHOOK_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, MIN_BROADCAST_WAGER',
    );
    process.exitCode = 1;
    return;
  }

  const config = loadConfigFromEnv();
  if (!config.discordWebhookUrl && !(config.telegramBotToken && config.telegramChatId)) {
    console.error(
      'No broadcast target configured — set DISCORD_WEBHOOK_URL and/or TELEGRAM_BOT_TOKEN+TELEGRAM_CHAT_ID.',
    );
    process.exitCode = 1;
    return;
  }

  for await (const event of readEventFeed(feedPath)) {
    const status = await broadcastEvent(event, config);
    if (status.skipped) {
      console.log(`Skipped ${event.type} (wager ${event.wagerXlm ?? 0} XLM below threshold)`);
      continue;
    }
    for (const result of status.results) {
      if (result.ok) {
        console.log(`✓ ${result.target}: ${event.type} (attempts=${result.attempts})`);
      } else {
        console.error(
          `✗ ${result.target}: ${event.type} failed — ${result.error} (attempts=${result.attempts})`,
        );
      }
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}

export { loadConfigFromEnv, DEFAULT_POLL_INTERVAL_MS };
