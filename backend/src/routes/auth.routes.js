const express = require('express');
const { postChallenge, postLogin } = require('../controllers/auth.controller');
const { rateLimit } = require('../middleware/rate-limit.middleware');

const router = express.Router();

const routeDocs = [
  {
    method: 'post',
    path: '/challenge',
    operationId: 'createLoginChallenge',
    summary: 'Issue a one-time login challenge for a wallet address to sign',
    tags: ['Auth'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['address'],
            properties: { address: { type: 'string' } },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Challenge issued successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['challenge'],
              properties: { challenge: { type: 'string' } },
            },
          },
        },
      },
      400: {
        description: 'Missing address',
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
  {
    method: 'post',
    path: '/login',
    operationId: 'login',
    summary: 'Verify a signed challenge and issue a session JWT',
    tags: ['Auth'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['address', 'signature'],
            properties: {
              address: { type: 'string' },
              signature: { type: 'string', description: 'Base64-encoded Ed25519 signature.' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Login successful',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'profile'],
              properties: {
                token: { type: 'string' },
                profile: { $ref: '#/components/schemas/UserProfileResponse' },
              },
            },
          },
        },
      },
      400: {
        description: 'Missing fields, no pending challenge, or the challenge expired',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          },
        },
      },
      401: {
        description: 'Signature does not verify against the given address',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          },
        },
      },
      503: {
        description: 'Login is not configured on this deployment (JWT_SECRET unset)',
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

router.post('/challenge', rateLimit('auth'), postChallenge);
router.post('/login', rateLimit('auth'), postLogin);

module.exports = router;
module.exports.routeDocs = routeDocs;
