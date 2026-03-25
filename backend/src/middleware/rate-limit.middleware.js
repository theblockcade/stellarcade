/**
 * Redis-backed rate limiter middleware.
 *
 * Uses a sliding window counter pattern stored in Redis.
 * Thresholds are configurable via environment variables:
 *   RATE_LIMIT_WALLET_MAX    — max requests for wallet routes (default: 10)
 *   RATE_LIMIT_WALLET_WINDOW — window in seconds for wallet routes (default: 60)
 *   RATE_LIMIT_AUTH_MAX      — max requests for auth-sensitive user routes (default: 20)
 *   RATE_LIMIT_AUTH_WINDOW   — window in seconds for auth routes (default: 60)
 *   RATE_LIMIT_GAMES_MAX     — max requests for game routes (default: 60)
 *   RATE_LIMIT_GAMES_WINDOW  — window in seconds for game routes (default: 60)
 */
const { client } = require('../config/redis');
const logger = require('../utils/logger');

const policies = {
  wallet: {
    max: () => parseInt(process.env.RATE_LIMIT_WALLET_MAX, 10) || 10,
    window: () => parseInt(process.env.RATE_LIMIT_WALLET_WINDOW, 10) || 60,
  },
  auth: {
    max: () => parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 20,
    window: () => parseInt(process.env.RATE_LIMIT_AUTH_WINDOW, 10) || 60,
  },
  games: {
    max: () => parseInt(process.env.RATE_LIMIT_GAMES_MAX, 10) || 60,
    window: () => parseInt(process.env.RATE_LIMIT_GAMES_WINDOW, 10) || 60,
  },
};

/**
 * Creates a rate limiter middleware for the given policy name.
 * @param {'wallet'|'auth'|'games'} policyName
 * @returns {Function} Express middleware
 */
const rateLimit = (policyName) => {
  return async (req, res, next) => {
    const policy = policies[policyName];
    if (!policy) {
      logger.error(`[RateLimit] Unknown policy: ${policyName}`);
      return next();
    }

    const max = policy.max();
    const windowSecs = policy.window();
    const identifier = req.user?.id || req.ip;
    const key = `ratelimit:${policyName}:${identifier}`;

    try {
      const current = await client.incr(key);

      if (current === 1) {
        await client.expire(key, windowSecs);
      }

      const ttl = await client.ttl(key);
      const remaining = Math.max(0, max - current);

      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(remaining));
      res.set('X-RateLimit-Reset', String(ttl));

      if (current > max) {
        res.set('Retry-After', String(ttl));
        return res.status(429).json({
          error: {
            message: 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: ttl,
          },
        });
      }

      next();
    } catch (error) {
      logger.error('[RateLimit] Redis error, allowing request through:', error);
      next();
    }
  };
};

module.exports = { rateLimit, policies };
