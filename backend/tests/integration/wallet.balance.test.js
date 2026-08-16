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

jest.mock('../../src/config/stellar', () => ({
  server: { loadAccount: jest.fn() },
  network: 'testnet',
  passphrase: 'Test SDF Network ; September 2015',
}));

jest.mock('../../src/middleware/auth.middleware', () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});

const router = require('../../src/routes/wallet.routes');
const { server } = require('../../src/config/stellar');

const VALID_ADDRESS = 'GCL3XXKSD2NTRWXS4SCWRZVXXBESRTQJW4E6XRQL2BLOWKEVGTAMEILN';

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

  test('returns the address\'s real on-chain balances from Horizon, not an internal ledger figure', async () => {
    server.loadAccount.mockResolvedValue({
      balances: [
        { asset_type: 'native', balance: '123.4567890' },
        { asset_type: 'credit_alphanum4', asset_code: 'USDC', balance: '50.0000000' },
      ],
    });

    const res = await request(app).get(`/wallet/${VALID_ADDRESS}/balance`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      address: VALID_ADDRESS,
      balances: { XLM: '123.4567890', USDC: '50.0000000' },
    });
    expect(server.loadAccount).toHaveBeenCalledWith(VALID_ADDRESS);
  });

  test('returns a zero balance, not an error, for a valid address that has never been funded on-chain', async () => {
    const StellarSdk = jest.requireActual('@stellar/stellar-sdk');
    server.loadAccount.mockRejectedValue(
      new StellarSdk.NotFoundError('Not Found', { status: 404, statusText: 'Not Found', data: {} })
    );

    const res = await request(app).get(`/wallet/${VALID_ADDRESS}/balance`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      address: VALID_ADDRESS,
      balances: { XLM: '0.0000000' },
    });
  });

  test('400s for a malformed address instead of asking Horizon', async () => {
    const res = await request(app).get('/wallet/not-a-real-address/balance');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ADDRESS');
    expect(server.loadAccount).not.toHaveBeenCalled();
  });

  test('surfaces a Horizon server error instead of masking it as a 200', async () => {
    const err = new Error('Horizon unavailable');
    err.response = { status: 503, data: {} };
    server.loadAccount.mockRejectedValue(err);

    const res = await request(app).get(`/wallet/${VALID_ADDRESS}/balance`);

    expect(res.status).toBe(502);
  });
});
