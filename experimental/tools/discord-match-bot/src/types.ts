export interface PlayerResult {
  handle: string;
  score: number;
  won: boolean;
}

export interface MatchResult {
  matchId: string;
  gameType: string;
  player1: PlayerResult;
  player2: PlayerResult;
  wagerAmount: number;
  netPayout: number;
  isJackpot: boolean;
  isTournament: boolean;
  settledAt: string;
  explorerUrl: string;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedFooter {
  text: string;
}

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: EmbedField[];
  footer?: EmbedFooter;
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  embeds: DiscordEmbed[];
}

export interface BotConfig {
  botToken: string;
  channelId: string;
  backendWsUrl: string;
  minAnnounceWager: number;
  webhookUrl?: string;
}

export interface RateLimitEntry {
  timestamp: number;
}

export interface RateLimitQueue {
  entries: RateLimitEntry[];
  maxMessages: number;
  windowMs: number;
}
