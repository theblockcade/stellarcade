import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { EventListener } from './event-listener';
import type { BotConfig, DiscordEmbed } from './types';

function makeEmbed(title = 'Test Match'): DiscordEmbed {
  return {
    title,
    description: 'Test description',
    color: 0x3498DB,
    fields: [{ name: 'Game', value: 'Test Game', inline: true }],
  };
}

class MockServer {
  private server: Server;
  private port = 0;
  handler: (req: IncomingMessage, res: ServerResponse) => void = (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
  };

  constructor() {
    this.server = createServer((req, res) => this.handler(req, res));
  }

  async start(): Promise<string> {
    await new Promise<void>((resolve) => this.server.listen(0, resolve));
    const address = this.server.address();
    this.port = typeof address === 'object' && address ? address.port : 0;
    return `http://127.0.0.1:${this.port}`;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }

  getPort(): number {
    return this.port;
  }
}

describe('EventListener', () => {
  let server: MockServer;
  let webhookUrl: string;

  beforeEach(async () => {
    server = new MockServer();
    webhookUrl = await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  function makeConfig(overrides: Partial<BotConfig> = {}): BotConfig {
    return {
      botToken: 'test-token',
      channelId: 'test-channel',
      backendWsUrl: 'wss://test.example.com/ws',
      minAnnounceWager: 100,
      webhookUrl,
      ...overrides,
    };
  }

  describe('start/stop lifecycle', () => {
    it('starts and stops without error', () => {
      const callback = vi.fn();
      const listener = new EventListener(makeConfig(), callback);

      listener.start();
      expect(() => listener.stop()).not.toThrow();
    });

    it('does not start twice if already running', () => {
      const callback = vi.fn();
      const listener = new EventListener(makeConfig(), callback);

      listener.start();
      listener.start(); // second start should be a no-op
      expect(() => listener.stop()).not.toThrow();
    });

    it('stop is safe to call when not started', () => {
      const callback = vi.fn();
      const listener = new EventListener(makeConfig(), callback);
      expect(() => listener.stop()).not.toThrow();
    });
  });

  describe('sendEmbed', () => {
    it('posts embed to webhook URL', async () => {
      let received: unknown = null;
      server.handler = (req, res) => {
        let body = '';
        req.on('data', (chunk: Buffer) => (body += chunk.toString()));
        req.on('end', () => {
          received = JSON.parse(body);
          res.writeHead(200);
          res.end('{}');
        });
      };

      const callback = vi.fn();
      const listener = new EventListener(makeConfig(), callback);
      await listener.sendEmbed(makeEmbed());

      expect(received).toHaveProperty('embeds');
      const payload = received as { embeds: DiscordEmbed[] };
      expect(payload.embeds).toHaveLength(1);
      expect(payload.embeds[0].title).toBe('Test Match');
    });

    it('invokes onMatchSettled callback with the embed', async () => {
      server.handler = (_req, res) => {
        res.writeHead(200);
        res.end('{}');
      };

      const callback = vi.fn();
      const listener = new EventListener(makeConfig(), callback);
      const embed = makeEmbed('Callback Test');
      await listener.sendEmbed(embed);

      expect(callback).toHaveBeenCalledWith(embed);
    });
  });

  describe('RateLimitQueue', () => {
    it('isRateLimited returns false when under limit', () => {
      const callback = vi.fn();
      const listener = new EventListener(makeConfig(), callback);
      expect(listener.isRateLimited()).toBe(false);
    });

    it('processQueue respects rate limit timing', async () => {
      const timestamps: number[] = [];
      server.handler = (_req, res) => {
        timestamps.push(Date.now());
        res.writeHead(200);
        res.end('{}');
      };

      const callback = vi.fn();
      const listener = new EventListener(makeConfig(), callback);

      const embeds = Array.from({ length: 3 }, (_, i) => makeEmbed(`Match ${i}`));
      await Promise.all(embeds.map((e) => listener.sendEmbed(e)));

      expect(timestamps).toHaveLength(3);
      // All messages should be sent (no rate limiting for 3 < 5)
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it('does not throw when processQueue is called concurrently', async () => {
      server.handler = (_req, res) => {
        res.writeHead(200);
        res.end('{}');
      };

      const callback = vi.fn();
      const listener = new EventListener(makeConfig(), callback);

      await Promise.all([
        listener.sendEmbed(makeEmbed('A')),
        listener.sendEmbed(makeEmbed('B')),
        listener.sendEmbed(makeEmbed('C')),
      ]);
    });
  });

  describe('reconnect', () => {
    it('can be called and stopped without error', () => {
      const callback = vi.fn();
      const listener = new EventListener(makeConfig(), callback);
      listener.start();
      listener.reconnect();
      listener.stop();
    });
  });
});
