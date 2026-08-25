export type GameEventType =
  | 'match_started'
  | 'wager_deposited'
  | 'round_settled'
  | 'jackpot_won'
  | 'tournament_final'
  | 'win_streak';

export interface GameEvent {
  type: GameEventType;
  timestamp: string;
  contractId: string;
  /** Player Stellar public key most relevant to the event, if any. */
  player?: string;
  /** Wager or win amount in XLM (whole units, not stroops), if applicable. */
  wagerXlm?: number;
  /** Streak length, for `win_streak` events. */
  streakCount?: number;
  /** Free-form extra payload fields for formatter use. */
  payload?: Record<string, unknown>;
}

export interface BroadcasterConfig {
  discordWebhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  /** Minimum wager (XLM) an event must carry to be broadcast. */
  minBroadcastWager: number;
}

export interface DispatchResult {
  target: 'discord' | 'telegram';
  ok: boolean;
  status?: number;
  error?: string;
  /** Number of retry attempts made before this result. */
  attempts: number;
}

export interface BroadcastStatus {
  event: GameEvent;
  /** True if the event did not meet the broadcast threshold and was skipped. */
  skipped: boolean;
  results: DispatchResult[];
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields: { name: string; value: string; inline?: boolean }[];
  url?: string;
  timestamp: string;
}

export interface DiscordWebhookPayload {
  embeds: DiscordEmbed[];
}

/** Injectable delay function, so tests can run retry/backoff paths instantly. */
export type Sleeper = (ms: number) => Promise<void>;
