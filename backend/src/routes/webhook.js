const express = require('express');
const verifyWebhookSignature = require('../middleware/webhook-signature.middleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Webhook Ingestion Endpoint
 * 
 * Secured by HMAC SHA-256 signature verification.
 */
router.post('/', verifyWebhookSignature, (req, res) => {
  logger.info('Received valid webhook payload', { type: req.body?.type });

  // In a real application, you would dispatch the webhook payload
  // to a queue or background worker here.

  res.status(200).json({ received: true });
});

module.exports = router;
