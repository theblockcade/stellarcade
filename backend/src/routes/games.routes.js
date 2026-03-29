const express = require('express');
const { getGames, getRecentGames, playSimpleGame } = require('../controllers/games.controller');
const auth = require('../middleware/auth.middleware');
const idempotency = require('../middleware/idempotency.middleware');
const { rateLimit } = require('../middleware/rate-limit.middleware');

const router = express.Router();

const routeDocs = [
  {
    method: 'get',
    path: '/',
    operationId: 'listGames',
    summary: 'List available games',
    tags: ['Games'],
    responses: {
      200: {
        description: 'Available games returned successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GamesCatalogResponse' },
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
  {
    method: 'get',
    path: '/recent',
    operationId: 'listRecentGames',
    summary: 'List recent games with pagination and filters',
    tags: ['Games'],
    parameters: [
      {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number to retrieve',
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 10 },
        description: 'Number of games to return per page',
      },
      {
        name: 'gameType',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Filter recent games by game type',
      },
      {
        name: 'status',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Filter recent games by result status',
      },
      {
        name: 'sortBy',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Field used for sorting',
      },
      {
        name: 'sortDir',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['asc', 'desc'] },
        description: 'Sort direction',
      },
    ],
    responses: {
      200: {
        description: 'Recent games returned successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RecentGamesResponse' },
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
  {
    method: 'post',
    path: '/play',
    operationId: 'playSimpleGame',
    summary: 'Play a game for the authenticated user',
    tags: ['Games'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/PlayGameRequest' },
        },
      },
    },
    responses: {
      200: {
        description: 'Game was processed successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PlayGameResponse' },
          },
        },
      },
      401: {
        description: 'Authentication failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AuthErrorResponse' },
          },
        },
      },
      409: {
        description: 'Idempotency key conflict detected',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/IdempotencyConflictResponse' },
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

router.get('/', rateLimit('games'), getGames);
router.get('/recent', rateLimit('games'), getRecentGames);
router.post('/play', auth, rateLimit('games'), idempotency, playSimpleGame);

module.exports = router;
module.exports.routeDocs = routeDocs;
