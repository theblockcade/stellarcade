const express = require('express');
const { getProfile, createProfile, getAuditLogs } = require('../controllers/users.controller');
const auth = require('../middleware/auth.middleware');
const { rateLimit } = require('../middleware/rate-limit.middleware');

const router = express.Router();

const routeDocs = [
  {
    method: 'get',
    path: '/profile',
    operationId: 'getUserProfile',
    summary: 'Fetch the authenticated user profile',
    tags: ['Users'],
    responses: {
      200: {
        description: 'User profile fetched successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserProfileResponse' },
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
    path: '/audit-logs',
    operationId: 'listUserAuditLogs',
    summary: 'List audit log entries',
    tags: ['Users'],
    parameters: [
      {
        name: 'actor',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Optional actor wallet address filter.',
      },
      {
        name: 'action',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          enum: ['wallet.deposit', 'wallet.withdraw', 'game.play'],
        },
        description: 'Optional action filter.',
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 50,
        },
        description: 'Maximum number of records returned.',
      },
    ],
    responses: {
      200: {
        description: 'Audit log entries fetched successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['items'],
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: 'Invalid query parameter',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
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
    path: '/create',
    operationId: 'createUserProfile',
    summary: 'Create a new user profile',
    tags: ['Users'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateProfileRequest' },
        },
      },
    },
    responses: {
      201: {
        description: 'User profile created successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateProfileResponse' },
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

router.get('/profile', auth, rateLimit('auth'), getProfile);
router.get('/audit-logs', auth, rateLimit('auth'), getAuditLogs);
router.post('/create', rateLimit('auth'), createProfile);

module.exports = router;
module.exports.routeDocs = routeDocs;
