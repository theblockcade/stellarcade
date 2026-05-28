const express = require('express');
const webhookSignature = require('../middleware/webhook-signature.middleware');

const router = express.Router();
const routeDocs = [
  {
    method: 'post',
    path: '/',
    operationId: 'receiveWebhookEvent',
    summary: 'Receive and acknowledge webhook events',
    tags: ['Wallet'],
    responses: {
      200: {
        description: 'Webhook payload accepted',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['received', 'timestamp'],
              properties: {
                received: { type: 'boolean', enum: [true] },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      401: {
        description: 'Invalid webhook signature',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AuthErrorResponse' },
          },
        },
      },
      500: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          },
        },
      },
    },
  },
];

const receiveWebhook = (req, res) => {
  res.status(200).json({
    received: true,
    timestamp: new Date().toISOString(),
  });
};

router.post('/', webhookSignature, receiveWebhook);

module.exports = router;
module.exports.routeDocs = routeDocs;
