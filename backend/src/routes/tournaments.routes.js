const express = require('express');
const { getTournaments } = require('../controllers/tournaments.controller');
const { rateLimit } = require('../middleware/rate-limit.middleware');

const router = express.Router();

const routeDocs = [
  {
    method: 'get',
    path: '/',
    operationId: 'getTournaments',
    summary: 'List all tournaments',
    tags: ['Tournaments'],
    responses: {
      200: {
        description: 'Tournaments returned successfully',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                required: ['tournamentId', 'gameId', 'status', 'prizePool'],
                properties: {
                  tournamentId: { type: 'string' },
                  gameId: { type: 'string' },
                  status: { type: 'string', enum: ['upcoming', 'active', 'finished'] },
                  prizePool: { type: 'string' },
                },
              },
            },
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

router.get('/', rateLimit('games'), getTournaments);

module.exports = router;
module.exports.routeDocs = routeDocs;
