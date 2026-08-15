const { createClient } = require('redis');
const logger = require('./logger');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  // Without this, node-redis queues commands indefinitely while
  // disconnected instead of rejecting them — rate-limit.middleware.js's
  // fail-open catch block never runs, and every rate-limited request hangs
  // forever instead of failing open when Redis is unreachable.
  disableOfflineQueue: true,
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis connected successfully'));

const connectPromise = client.connect().catch((err) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.error('Redis connection failed:', err);
  }
});

module.exports = {
  client,
  connectPromise,
};
