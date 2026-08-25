import fetch, { Response } from 'node-fetch';
import { formatDiscordEmbed, formatTelegramMessage } from './formatters';
import type {
  BroadcasterConfig,
  BroadcastStatus,
  DispatchResult,
  GameEvent,
  Sleeper,
} from './types';

/** Max attempts (including the first) before a dispatch gives up. */
const MAX_ATTEMPTS = 4;
/** Base backoff delay in ms; doubles on each retry (exponential backoff). */
const BASE_BACKOFF_MS = 500;

const defaultSleep: Sleeper = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Reads `Retry-After` from a 429 response (seconds or an HTTP-date) and
 * returns a millisecond delay, falling back to exponential backoff when the
 * header is absent or unparseable.
 */
function retryAfterMs(response: Response, fallbackMs: number): number {
  const header = response.headers.get('retry-after');
  if (!header) {
    return fallbackMs;
  }
  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds)) {
    return Math.max(0, asSeconds * 1000);
  }
  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now());
  }
  return fallbackMs;
}

/**
 * POST `body` to `url` with retry-with-backoff on HTTP 429 (rate limited)
 * and on network errors. Non-429 non-2xx responses are NOT retried (they
 * indicate a payload/config problem, not a transient condition).
 */
async function postWithRetry(
  target: DispatchResult['target'],
  url: string,
  body: unknown,
  sleep: Sleeper,
): Promise<DispatchResult> {
  let lastError: string | undefined;
  let lastStatus: number | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { target, ok: true, status: response.status, attempts: attempt };
      }

      lastStatus = response.status;
      lastError = `HTTP ${response.status}`;

      if (response.status === 429 && attempt < MAX_ATTEMPTS) {
        const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
        await sleep(retryAfterMs(response, backoff));
        continue;
      }

      // Non-429 failure: do not retry.
      return { target, ok: false, status: lastStatus, error: lastError, attempts: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
        continue;
      }
    }
  }

  return { target, ok: false, status: lastStatus, error: lastError, attempts: MAX_ATTEMPTS };
}

/**
 * Broadcasts `event` to every configured target (Discord and/or Telegram).
 * Events below `config.minBroadcastWager` are skipped entirely (no network
 * call). A failure or timeout dispatching to one target never blocks the
 * other — both are attempted independently via `Promise.allSettled`.
 */
export async function broadcastEvent(
  event: GameEvent,
  config: BroadcasterConfig,
  sleep: Sleeper = defaultSleep,
  telegramApiBase: string = DEFAULT_TELEGRAM_API_BASE,
): Promise<BroadcastStatus> {
  const wager = event.wagerXlm ?? 0;
  if (wager < config.minBroadcastWager) {
    return { event, skipped: true, results: [] };
  }

  const dispatches: Promise<DispatchResult>[] = [];

  if (config.discordWebhookUrl) {
    dispatches.push(
      postWithRetry('discord', config.discordWebhookUrl, formatDiscordEmbed(event), sleep),
    );
  }

  if (config.telegramBotToken && config.telegramChatId) {
    const telegramUrl = `${telegramApiBase}/bot${config.telegramBotToken}/sendMessage`;
    dispatches.push(
      postWithRetry(
        'telegram',
        telegramUrl,
        {
          chat_id: config.telegramChatId,
          text: formatTelegramMessage(event),
          parse_mode: 'HTML',
        },
        sleep,
      ),
    );
  }

  const settled = await Promise.allSettled(dispatches);
  const results: DispatchResult[] = settled.map((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      return outcome.value;
    }
    // postWithRetry itself never rejects (all paths return a DispatchResult),
    // but guard defensively so one target's unexpected throw can't drop the
    // other's result or crash the whole broadcast.
    const target = dispatches.length === 2 ? (index === 0 ? 'discord' : 'telegram') : 'discord';
    return {
      target,
      ok: false,
      error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
      attempts: 0,
    };
  });

  return { event, skipped: false, results };
}
