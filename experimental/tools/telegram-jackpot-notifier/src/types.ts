/** A jackpot win event parsed from on-chain contract events */
export interface JackpotWinEvent {
  winnerAddress: string;
  winnerHandle?: string;
  prizeAmount: number;
  gameTitle: string;
  txHash: string;
  timestamp: number;
}

/** Configuration loaded from environment variables */
export interface NotifierConfig {
  telegramBotToken: string;
  chatId: string;
  rpcUrl: string;
  /** Minimum XLM amount to trigger a notification */
  minNotifyAmount: number;
  /** Polling interval in ms (default 15000) */
  pollIntervalMs?: number;
}

/** Rate limiter state */
export interface RateLimiterState {
  tokens: number;
  lastRefill: number;
}

/** Retry state for exponential backoff */
export interface RetryState {
  attempt: number;
  maxAttempts: number;
  baseDelayMs: number;
}
