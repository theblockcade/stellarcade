import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { broadcastEvent } from './broadcaster';
import type { BroadcasterConfig, GameEvent, Sleeper } from './types';

const baseEvent: GameEvent = {
  type: 'jackpot_won',
  timestamp: '2026-08-24T12:00:00.000Z',
  contractId: 'CABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQR',
  wagerXlm: 500,
};

/** A tiny mock HTTP server whose handler is swappable per test. */
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
}

describe('broadcastEvent', () => {
  let discordServer: MockServer;
  let telegramServer: MockServer;
  let discordUrl: string;
  let telegramBaseUrl: string;
  const noopSleep: Sleeper = vi.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    discordServer = new MockServer();
    telegramServer = new MockServer();
    discordUrl = await discordServer.start();
    telegramBaseUrl = await telegramServer.start();
    vi.mocked(noopSleep).mockClear();
  });

  afterEach(async () => {
    await discordServer.stop();
    await telegramServer.stop();
  });

  function telegramConfig(overrides: Partial<BroadcasterConfig> = {}): BroadcasterConfig {
    return {
      discordWebhookUrl: discordUrl,
      telegramBotToken: 'test-token',
      telegramChatId: '12345',
      minBroadcastWager: 100,
      ...overrides,
    };
  }

  it('skips events below the minimum broadcast wager without any network call', async () => {
    let discordCalled = false;
    discordServer.handler = (_req, res) => {
      discordCalled = true;
      res.writeHead(200);
      res.end('{}');
    };

    const status = await broadcastEvent(
      { ...baseEvent, wagerXlm: 10 },
      telegramConfig({ minBroadcastWager: 100, telegramBotToken: undefined, telegramChatId: undefined }),
      noopSleep,
    );

    expect(status.skipped).toBe(true);
    expect(status.results).toHaveLength(0);
    expect(discordCalled).toBe(false);
  });

  it('dispatches to Discord only when Telegram is not configured', async () => {
    let received: unknown = null;
    discordServer.handler = (req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        received = JSON.parse(body);
        res.writeHead(200);
        res.end('{}');
      });
    };

    const status = await broadcastEvent(
      baseEvent,
      { discordWebhookUrl: discordUrl, minBroadcastWager: 100 },
      noopSleep,
    );

    expect(status.skipped).toBe(false);
    expect(status.results).toEqual([
      expect.objectContaining({ target: 'discord', ok: true, attempts: 1 }),
    ]);
    expect(received).toHaveProperty('embeds');
  });

  it('dispatches to both Discord and Telegram independently', async () => {
    let telegramReceived: unknown = null;
    discordServer.handler = (_req, res) => {
      res.writeHead(200);
      res.end('{}');
    };
    telegramServer.handler = (req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        telegramReceived = JSON.parse(body);
        res.writeHead(200);
        res.end('{}');
      });
    };

    const status = await broadcastEvent(
      baseEvent,
      {
        discordWebhookUrl: discordUrl,
        telegramBotToken: 'token',
        telegramChatId: 'chat',
        minBroadcastWager: 100,
      },
      noopSleep,
      telegramBaseUrl,
    );

    expect(status.results).toHaveLength(2);
    const discordResult = status.results.find((r) => r.target === 'discord');
    const telegramResult = status.results.find((r) => r.target === 'telegram');
    expect(discordResult?.ok).toBe(true);
    expect(telegramResult?.ok).toBe(true);
    expect(telegramReceived).toMatchObject({ chat_id: 'chat', parse_mode: 'HTML' });
  });

  it('retries on 429 with backoff derived from Retry-After and eventually succeeds', async () => {
    let callCount = 0;
    discordServer.handler = (_req, res) => {
      callCount++;
      if (callCount < 3) {
        res.writeHead(429, { 'Retry-After': '1' });
        res.end('rate limited');
        return;
      }
      res.writeHead(200);
      res.end('{}');
    };

    const status = await broadcastEvent(
      baseEvent,
      { discordWebhookUrl: discordUrl, minBroadcastWager: 100 },
      noopSleep,
    );

    expect(status.results[0]).toEqual(
      expect.objectContaining({ target: 'discord', ok: true, attempts: 3 }),
    );
    expect(callCount).toBe(3);
    // Backoff sleep was invoked between retries (Retry-After: 1s -> 1000ms).
    expect(noopSleep).toHaveBeenCalledWith(1000);
  });

  it('gives up after the max attempts if 429 persists', async () => {
    let callCount = 0;
    discordServer.handler = (_req, res) => {
      callCount++;
      res.writeHead(429);
      res.end('rate limited');
    };

    const status = await broadcastEvent(
      baseEvent,
      { discordWebhookUrl: discordUrl, minBroadcastWager: 100 },
      noopSleep,
    );

    expect(status.results[0]).toEqual(
      expect.objectContaining({ target: 'discord', ok: false, status: 429 }),
    );
    expect(callCount).toBe(4); // MAX_ATTEMPTS
  });

  it('does not retry on non-429 error responses', async () => {
    let callCount = 0;
    discordServer.handler = (_req, res) => {
      callCount++;
      res.writeHead(400);
      res.end('bad request');
    };

    const status = await broadcastEvent(
      baseEvent,
      { discordWebhookUrl: discordUrl, minBroadcastWager: 100 },
      noopSleep,
    );

    expect(status.results[0]).toEqual(
      expect.objectContaining({ target: 'discord', ok: false, status: 400 }),
    );
    expect(callCount).toBe(1);
  });

  it('does not fail the whole broadcast on a network timeout to one target', async () => {
    await discordServer.stop(); // simulate an unreachable Discord endpoint

    const status = await broadcastEvent(
      baseEvent,
      { discordWebhookUrl: discordUrl, minBroadcastWager: 100 },
      noopSleep,
    );

    expect(status.results).toHaveLength(1);
    expect(status.results[0].ok).toBe(false);
    expect(status.results[0].error).toBeDefined();
  });

  it('returns no results when no target is configured', async () => {
    const status = await broadcastEvent(baseEvent, { minBroadcastWager: 100 }, noopSleep);
    expect(status.skipped).toBe(false);
    expect(status.results).toHaveLength(0);
  });
});
