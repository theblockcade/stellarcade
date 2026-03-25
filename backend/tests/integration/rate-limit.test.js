const express = require('express');
const request = require('supertest');

// Mock redis client
const mockRedisClient = {
  incr: jest.fn(),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(60),
  get: jest.fn(),
  setEx: jest.fn().mockResolvedValue('OK'),
  connect: jest.fn().mockResolvedValue('OK'),
  on: jest.fn(),
  isOpen: true,
};

jest.mock('../../src/config/redis', () => ({
  client: mockRedisClient,
  connectPromise: Promise.resolve(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { rateLimit } = require('../../src/middleware/rate-limit.middleware');

const createApp = (policyName) => {
  const app = express();
  app.use(express.json());
  app.get('/test', rateLimit(policyName), (req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
};

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.ttl.mockResolvedValue(60);
  });

  describe('threshold breach', () => {
    test('returns 429 when request count exceeds limit', async () => {
      const app = createApp('wallet');
      // Simulate exceeding the default wallet limit (10)
      mockRedisClient.incr.mockResolvedValue(11);
      mockRedisClient.ttl.mockResolvedValue(45);

      const res = await request(app).get('/test');

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(res.body.error.retryAfter).toBe(45);
      expect(res.headers['retry-after']).toBe('45');
    });

    test('allows request when under the limit', async () => {
      const app = createApp('wallet');
      mockRedisClient.incr.mockResolvedValue(5);

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('sets rate limit headers on successful requests', async () => {
      const app = createApp('wallet');
      mockRedisClient.incr.mockResolvedValue(3);
      mockRedisClient.ttl.mockResolvedValue(55);

      const res = await request(app).get('/test');

      expect(res.headers['x-ratelimit-limit']).toBe('10');
      expect(res.headers['x-ratelimit-remaining']).toBe('7');
      expect(res.headers['x-ratelimit-reset']).toBe('55');
    });
  });

  describe('reset window', () => {
    test('sets TTL on first request in a window', async () => {
      const app = createApp('auth');
      mockRedisClient.incr.mockResolvedValue(1);

      await request(app).get('/test');

      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:auth:'),
        60
      );
    });

    test('does not reset TTL on subsequent requests', async () => {
      const app = createApp('auth');
      mockRedisClient.incr.mockResolvedValue(5);

      await request(app).get('/test');

      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });
  });

  describe('per-route policy differences', () => {
    test('wallet policy has limit of 10', async () => {
      const app = createApp('wallet');
      mockRedisClient.incr.mockResolvedValue(10);

      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('10');
    });

    test('auth policy has limit of 20', async () => {
      const app = createApp('auth');
      mockRedisClient.incr.mockResolvedValue(20);

      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('20');
    });

    test('games policy has limit of 60', async () => {
      const app = createApp('games');
      mockRedisClient.incr.mockResolvedValue(60);

      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('60');
    });

    test('wallet is stricter than games', async () => {
      // At 11 requests: wallet blocks, games allows
      mockRedisClient.incr.mockResolvedValue(11);

      const walletApp = createApp('wallet');
      const gamesApp = createApp('games');

      const walletRes = await request(walletApp).get('/test');
      const gamesRes = await request(gamesApp).get('/test');

      expect(walletRes.status).toBe(429);
      expect(gamesRes.status).toBe(200);
    });
  });

  describe('redis failure fallback', () => {
    test('allows request through when redis errors', async () => {
      const app = createApp('wallet');
      mockRedisClient.incr.mockRejectedValue(new Error('Redis connection lost'));

      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('env variable overrides', () => {
    test('respects RATE_LIMIT_WALLET_MAX override', async () => {
      process.env.RATE_LIMIT_WALLET_MAX = '5';
      const app = createApp('wallet');
      mockRedisClient.incr.mockResolvedValue(6);

      const res = await request(app).get('/test');

      expect(res.status).toBe(429);
      delete process.env.RATE_LIMIT_WALLET_MAX;
    });
  });
});
