import type { RetryState } from './types.js';

const TELEGRAM_API = 'https://api.telegram.org';

/** Format a JackpotWinEvent into an HTML message for Telegram. */
export function formatJackpotMessage(event: {
  winnerAddress: string;
  winnerHandle?: string;
  prizeAmount: number;
  gameTitle: string;
  txHash: string;
}): string {
  const winner = event.winnerHandle
    ? `<b>@${escapeHtml(event.winnerHandle)}</b> (<code>${truncateAddress(event.winnerAddress)}</code>)`
    : `<code>${truncateAddress(event.winnerAddress)}</code>`;

  const explorerUrl = `https://stellar.expert/explorer/public/tx/${event.txHash}`;

  return [
    `🏆 <b>JACKPOT WIN!</b>`,
    ``,
    `🎮 <b>${escapeHtml(event.gameTitle)}</b>`,
    `💰 Winner: ${winner}`,
    `💎 Prize: <b>${event.prizeAmount.toFixed(2)} XLM</b>`,
    ``,
    `🔗 <a href="${explorerUrl}">View on Stellar Expert</a>`,
  ].join('\n');
}

/** Truncate a Stellar address to first 8 + last 4 chars for display. */
export function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

/** Escape HTML special characters for Telegram HTML parse mode. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Token-bucket rate limiter. Refills tokens up to max based on elapsed time. */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRatePerMs: number;

  constructor(maxTokensPerSec: number) {
    this.maxTokens = maxTokensPerSec;
    this.tokens = maxTokensPerSec;
    this.lastRefill = Date.now();
    this.refillRatePerMs = maxTokensPerSec / 1000;
  }

  /** Returns true if a token is available, false if rate limited. Consumes one token. */
  tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /** Returns milliseconds until the next token is available. */
  timeUntilNextToken(): number {
    this.refill();
    if (this.tokens >= 1) return 0;
    return Math.ceil((1 - this.tokens) / this.refillRatePerMs);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRatePerMs);
    this.lastRefill = now;
  }
}

/** Execute with exponential backoff retry. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  state: RetryState,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= state.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt < state.maxAttempts) {
        const delay = state.baseDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * delay * 0.1;
        await sleep(delay + jitter);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Send a message via Telegram Bot API. */
export async function sendMessage(
  botToken: string,
  chatId: string,
  html: string,
): Promise<void> {
  const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;
  const body = JSON.stringify({
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${text}`);
  }
}

/** High-level notify: format, rate-limit, retry, send. */
export async function notifyJackpotWin(
  botToken: string,
  chatId: string,
  event: {
    winnerAddress: string;
    winnerHandle?: string;
    prizeAmount: number;
    gameTitle: string;
    txHash: string;
  },
  rateLimiter: RateLimiter,
): Promise<void> {
  const html = formatJackpotMessage(event);

  // Wait for rate limiter
  while (!rateLimiter.tryAcquire()) {
    const waitMs = rateLimiter.timeUntilNextToken();
    await sleep(Math.max(waitMs, 10));
  }

  await withRetry(
    () => sendMessage(botToken, chatId, html),
    { attempt: 0, maxAttempts: 5, baseDelayMs: 1000 },
  );
}
