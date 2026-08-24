const express = require('express');
const {
  getProfile,
  createProfile,
  updateProfile,
  getAuditLogs,
} = require('../controllers/users.controller');
const auth = require('../middleware/auth.middleware');
const { rateLimit } = require('../middleware/rate-limit.middleware');

const router = express.Router();

const routeDocs = [
  {
    method: 'get',
    path: '/profile',
    operationId: 'getUserProfile',
    summary: 'Fetch a profile by wallet address',
    tags: ['Users'],
    parameters: [
      {
        name: 'address',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: 'Stellar wallet address (G...) to look up.',
      },
    ],
    responses: {
      200: {
        description: 'Profile fetched successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserProfileResponse' },
          },
        },
      },
      400: {
        description: 'Missing or invalid "address" query parameter',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          },
        },
      },
      404: {
        description: 'No profile exists for that wallet address yet — the wallet needs onboarding',
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
    summary:
      'Create a new profile (idempotent — returns the existing one if the wallet already has a profile)',
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
        description: 'Profile created (or already existed) successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserProfileResponse' },
          },
        },
      },
      400: {
        description: 'Missing walletAddress',
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
    path: '/update',
    operationId: 'updateUserProfile',
    summary: 'Update an existing profile — username and/or Telegram link fields',
    tags: ['Users'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
        },
      },
    },
    responses: {
      200: {
        description: 'Profile updated successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserProfileResponse' },
          },
        },
      },
      400: {
        description: 'Missing walletAddress',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
          },
        },
      },
      404: {
        description: 'No existing profile for that wallet address — use /create first',
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

router.get('/profile', getProfile);
router.get('/audit-logs', auth, rateLimit('auth'), getAuditLogs);
router.post('/create', rateLimit('auth'), createProfile);
router.post('/update', rateLimit('auth'), updateProfile);

module.exports = router;
module.exports.routeDocs = routeDocs;
