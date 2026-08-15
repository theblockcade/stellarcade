const crypto = require('crypto');
const correlationStore = require('../utils/correlation-store');

/**
 * Middleware for generating and propagating request correlation IDs.
 *
 * - Checks for incoming 'X-Correlation-Id' header.
 * - Generates a new UUID if not provided.
 * - Stores the ID in AsyncLocalStorage for downstream log propagation.
 * - Sets 'X-Correlation-Id' in response headers.
 */
const correlationIdMiddleware = (req, res, next) => {
  const correlationId = req.header('X-Correlation-Id') || crypto.randomUUID();

  // Set the correlation ID in the current async execution context
  correlationStore.run({ correlationId }, () => {
    // Attach to req for convenience if needed by other middleware
    req.correlationId = correlationId;

    // Set for response propagation
    res.setHeader('X-Correlation-Id', correlationId);

    // Continue with the execution chain within the store's context
    next();
  });
};

module.exports = correlationIdMiddleware;
