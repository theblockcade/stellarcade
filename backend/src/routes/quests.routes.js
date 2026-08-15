const express = require('express');
const { getQuests } = require('../controllers/quests.controller');
const { rateLimit } = require('../middleware/rate-limit.middleware');

const router = express.Router();

const routeDocs = [
  {
    method: 'get',
    path: '/',
    operationId: 'getQuests',
    summary: 'List a player\'s quest progress',
    tags: ['Quests'],
    parameters: [
      {
        name: 'player',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: 'Stellar wallet address (G...) to fetch quest progress for.',
      },
    ],
    responses: {
      200: {
        description: 'Quest progress returned successfully',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                required: ['questId', 'progress', 'target', 'claimed', 'streak'],
                properties: {
                  questId: { type: 'string' },
                  progress: { type: 'integer' },
                  target: { type: 'integer' },
                  claimed: { type: 'boolean' },
                  streak: { type: 'integer' },
                },
              },
            },
          },
        },
      },
      400: {
        description: 'Missing or invalid "player" query parameter',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
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

router.get('/', rateLimit('games'), getQuests);

module.exports = router;
module.exports.routeDocs = routeDocs;
