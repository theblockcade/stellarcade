const request = require('supertest');

// Mock database connection to prevent process.exit(1)
jest.mock('../../src/config/database', () => {
  const mockKnex = {
    raw: jest.fn().mockResolvedValue({}),
  };
  return mockKnex;
});

// Mock redis connection to prevent connection errors
jest.mock('../../src/config/redis', () => ({
  client: {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue({}),
    isOpen: true,
    quit: jest.fn().mockResolvedValue({}),
  },
  connectPromise: Promise.resolve(),
}));

const app = require('../../src/server');

/**
 * API Versioning Integration Tests
 *
 * Verifies that:
 * 1. The X-API-Version header is correctly handled.
 * 2. V1 routes under /api/v1/* are accessible.
 * 3. Legacy routes under /api/* remain accessible for backward compatibility.
 */
describe('API Versioning Integration', () => {
  // Mocking database and redis might be necessary if they are not running
  // For this test, we mainly care about route matching and middleware execution

  describe('Middleware version negotiation', () => {
    test('should default to v1 when no X-API-Version header is provided', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers['x-api-version']).toBe('v1');
    });

    test('should return the specified version in the X-API-Version header', async () => {
      const response = await request(app).get('/api/health').set('X-API-Version', 'v2');
      expect(response.headers['x-api-version']).toBe('v2');
    });
  });

  describe('Route Versioning', () => {
    test('should access health endpoint via /api/v1/health', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Operational');
      expect(response.headers['x-api-version']).toBe('v1');
    });

    test('should access health endpoint via legacy /api/health (backward compatibility)', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Operational');
    });

    test('should return 404 for invalid version prefix', async () => {
      const response = await request(app).get('/api/v2/health');
      expect(response.status).toBe(404);
    });
  });
});
