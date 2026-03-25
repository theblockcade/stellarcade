const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Webhook Signature Verification Middleware
 * 
 * Validates incoming webhooks using an HMAC SHA-256 signature scheme
 * with replay attack (timestamp) prevention.
 * 
 * Expected Header: x-webhook-signature
 * Expected Format: t=<timestamp>,v1=<signature>
 * 
 * Requires `req.rawBody` to be populated by the Express body parser.
 */

// 5 minute tolerance for webhook delays/replays
const TOLERANCE_MS = 5 * 60 * 1000; 

const verifyWebhookSignature = (req, res, next) => {
  const signatureHeader = req.headers['x-webhook-signature'];

  if (!signatureHeader) {
    logger.warn('Webhook request missing x-webhook-signature header');
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  // Parse the header format: t=1234567890,v1=abcdef123456...
  const parts = signatureHeader.split(',');
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Part = parts.find(p => p.startsWith('v1='));

  if (!tPart || !v1Part) {
    logger.warn('Webhook request signature header malformed');
    return res.status(401).json({ error: 'Malformed webhook signature' });
  }

  const timestampStr = tPart.split('=')[1];
  const providedSignature = v1Part.split('=')[1];

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return res.status(401).json({ error: 'Invalid signature timestamp' });
  }

  // Prevent replay attacks
  const now = Date.now();
  if (now - timestamp > TOLERANCE_MS) {
    logger.warn(`Webhook signature expired. Age: ${now - timestamp}ms`);
    return res.status(401).json({ error: 'Webhook signature expired' });
  }

  if (timestamp > now + TOLERANCE_MS) {
    logger.warn(`Webhook signature from the future: ${timestampStr}`);
    return res.status(401).json({ error: 'Webhook signature timestamp invalid' });
  }

  // Validate presence of rawBody and Secret
  if (!req.rawBody) {
    logger.error('Webhook verification failed: req.rawBody is missing. Check express.json configuration.');
    // We treat this as a 500 since our infrastructure failed to supply what we need,
    // but 401 is safer to not leak reasons. Let's return 401 for safety, or 500 for strict correctness.
    return res.status(500).json({ error: 'Internal server error processing webhook payload' });
  }

  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    logger.error('Webhook verification failed: WEBHOOK_SECRET is not configured.');
    return res.status(500).json({ error: 'Internal server error processing webhook' });
  }

  // Compute the expected HMAC
  // Payload string = timestamp + '.' + rawBody
  const payloadString = `${timestampStr}.${req.rawBody.toString('utf8')}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');

  // Use timing-safe comparison
  // Both strings must be the same length for timingSafeEqual, protect against length assertion failures
  const providedBuffer = Buffer.from(providedSignature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length) {
    logger.warn('Webhook signature length mismatch');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (err) {
    logger.error('Error during webhook signature comparison:', err);
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  if (!isValid) {
    logger.warn('Webhook signature mismatch');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  // Verification passed
  next();
};

module.exports = verifyWebhookSignature;
