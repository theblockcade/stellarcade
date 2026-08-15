const request = require('supertest');
const express = require('express');
const correlationIdMiddleware = require('../../src/middleware/correlation-id.middleware');
const errorHandler = require('../../src/middleware/errorHandler.middleware');

describe('Correlation ID Middleware Integration', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Setup middleware for testing
    app.use(correlationIdMiddleware);

    // Success endpoint
    app.get('/test/success', (req, res) => {
      res.status(200).json({
        status: 'ok',
        correlationIdInReq: req.correlationId,
      });
    });

    // Error endpoint
    app.get('/test/error', (req, res, next) => {
      const err = new Error('Triggered Error');
      err.statusCode = 418; // I'm a teapot
      next(err);
    });

    // Apply error handler
    app.use(errorHandler);
  });

  test('should generate a new correlation ID if none is provided in headers', async () => {
    const res = await request(app).get('/test/success');

    expect(res.status).toBe(200);
    expect(res.headers['x-correlation-id']).toBeDefined();
    // Check if it's a UUID-like structure (8-4-4-4-12)
    expect(res.headers['x-correlation-id']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(res.body.correlationIdInReq).toBe(res.headers['x-correlation-id']);
  });

  test('should passthrough the correlation ID if provided in request headers', async () => {
    const customId = 'fixed-test-correlation-id-999';
    const res = await request(app).get('/test/success').set('X-Correlation-Id', customId);

    expect(res.status).toBe(200);
    expect(res.headers['x-correlation-id']).toBe(customId);
    expect(res.body.correlationIdInReq).toBe(customId);
  });

  test('should propagate the correlation ID into error response bodies', async () => {
    const res = await request(app).get('/test/error');

    expect(res.status).toBe(418);
    expect(res.headers['x-correlation-id']).toBeDefined();
    expect(res.body.error).toBeDefined();
    expect(res.body.error.correlationId).toBe(res.headers['x-correlation-id']);
  });

  test('should maintain the same ID for provided id in error responses', async () => {
    const customId = 'error-passthrough-id';
    const res = await request(app).get('/test/error').set('X-Correlation-Id', customId);

    expect(res.status).toBe(418);
    expect(res.headers['x-correlation-id']).toBe(customId);
    expect(res.body.error.correlationId).toBe(customId);
  });
});
