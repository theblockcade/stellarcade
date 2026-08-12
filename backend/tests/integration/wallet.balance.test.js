const request = require('supertest');
const express = require('express');

jest.mock('../../src/config/database', () => {
  const mock = jest.fn();
  mock.raw = jest.fn().mockResolvedValue({});
  return mock;
});

jest.mock('../../src/config/redis', () => {
  const mockClient = {
    get: jest.fn(),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue('OK'),
    ttl: jest.fn().mockResolvedValue(60),
    setEx: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    isOpen: true,
  };
  return { client: mockClient, connectPromise: Promise.resolve() };
});

jest.mock('../../src/services/stellar.service', () => ({
  assertWalletNetwork: jest.fn(),
}));

jest.mock('../../src/middleware/auth.middleware', () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});

const router = require('../../src/routes/wallet.routes');
const User = require('../../src/models/User.model');

jest.mock('../../src/models/User.model');

const app = express();
app.use(express.json());
app.use('/wallet', router);
app.use((err, req, res, _next) => {
  res.status(err.statusCode || 500).json({ error: { message: err.message, code: err.code } });
});

describe('GET /wallet/:address/balance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns the real DB-backed balance, not a fabricated number', async () => {
    User.findByWallet.mockResolvedValue({
      id: 1,
      wallet_address: 'GALICE1234567890',
      balance: '42.5000000',
    });

    const res = await request(app).get('/wallet/GALICE1234567890/balance');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      address: 'GALICE1234567890',
      balances: { XLM: '42.5000000' },
    });
    expect(User.findByWallet).toHaveBeenCalledWith('GALICE1234567890');
  });

  test('404s for a wallet address with no account, instead of inventing a zero balance', async () => {
    User.findByWallet.mockResolvedValue(null);

    const res = await request(app).get('/wallet/GUNKNOWN/balance');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('WALLET_NOT_FOUND');
  });
});
