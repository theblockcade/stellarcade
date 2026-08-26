import fetch from 'node-fetch';
import type { BotConfig, DiscordEmbed, DiscordWebhookPayload, RateLimitEntry } from './types';

const RATE_LIMIT_MAX_MESSAGES = 5;
const RATE_LIMIT_WINDOW_MS = 5000;
const BASE_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;

export class EventListener {
  private config: BotConfig;
  private onMatchSettled: (embed: DiscordEmbed) => void;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private rateLimitEntries: RateLimitEntry[] = [];
  private queue: DiscordEmbed[] = [];
  private processingQueue = false;
  private running = false;

  constructor(config: BotConfig, onMatchSettled: (embed: DiscordEmbed) => void) {
    this.config = config;
    this.onMatchSettled = onMatchSettled;
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.reconnectAttempts = 0;
    this.simulateConnect();
  }

  stop(): void {
    this.running = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  reconnect(): void {
    if (!this.running) {
      return;
    }
    this.stop();
    const delay = Math.min(
      BASE_RECONNECT_MS * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_MS,
    );
    this.reconnectAttempts++;
    setTimeout(() => {
      if (this.running) {
        this.simulateConnect();
      }
    }, delay);
  }

  async sendEmbed(embed: DiscordEmbed): Promise<void> {
    this.enqueue(embed);
    await this.processQueue();
  }

  isRateLimited(): boolean {
    const now = Date.now();
    this.pruneOldEntries(now);
    return this.rateLimitEntries.length >= RATE_LIMIT_MAX_MESSAGES;
  }

  async processQueue(): Promise<void> {
    if (this.processingQueue) {
      return;
    }
    this.processingQueue = true;

    while (this.queue.length > 0) {
      if (this.isRateLimited()) {
        const oldestEntry = this.rateLimitEntries[0];
        const waitMs = oldestEntry
          ? RATE_LIMIT_WINDOW_MS - (Date.now() - oldestEntry.timestamp)
          : RATE_LIMIT_WINDOW_MS;
        await this.sleep(Math.max(0, waitMs));
        continue;
      }

      const embed = this.queue.shift()!;
      await this.postEmbed(embed);
      this.rateLimitEntries.push({ timestamp: Date.now() });
    }

    this.processingQueue = false;
  }

  private enqueue(embed: DiscordEmbed): void {
    this.queue.push(embed);
  }

  private pruneOldEntries(now: number): void {
    this.rateLimitEntries = this.rateLimitEntries.filter(
      (entry) => now - entry.timestamp < RATE_LIMIT_WINDOW_MS,
    );
  }

  private async postEmbed(embed: DiscordEmbed): Promise<void> {
    const url = this.getWebhookUrl();
    if (!url) {
      return;
    }

    const payload: DiscordWebhookPayload = { embeds: [embed] };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      this.onMatchSettled(embed);
    } catch {
      // Webhook post failed silently — rate limit queue continues
    }
  }

  private getWebhookUrl(): string | null {
    if (this.config.webhookUrl) {
      return this.config.webhookUrl;
    }
    if (this.config.botToken && this.config.channelId) {
      return `https://discord.com/api/webhooks/${this.config.channelId}/${this.config.botToken}`;
    }
    return null;
  }

  private simulateConnect(): void {
    this.pollInterval = setInterval(() => {
      // Simulated connection — in production this would be a WebSocket listener
      // that calls this.onMatchSettled when match settlement events arrive
    }, 5000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
