const request = require('supertest');
const express = require('express');

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
  req.user = { id: 1, walletAddress: 'GALICE1234567890' };
  next();
});

jest.mock('../../src/middleware/idempotency.middleware', () => (req, res, next) => next());

jest.mock('../../src/services/audit.service', () => ({
  log: jest.fn().mockResolvedValue(undefined),
}));

const mockDbUpdate = jest.fn().mockReturnThis();
const mockDbWhere = jest.fn().mockReturnThis();
const mockDb = jest.fn(() => ({
  where: mockDbWhere,
  update: mockDbUpdate,
}));
mockDb.fn = { now: jest.fn(() => 'NOW()') };
jest.mock('../../src/config/database', () => mockDb);

const router = require('../../src/routes/wallet.routes');
const User = require('../../src/models/User.model');
const TransactionModel = require('../../src/models/Transaction.model');

jest.mock('../../src/models/User.model');
jest.mock('../../src/models/Transaction.model');

const app = express();
app.use(express.json());
app.use('/wallet', router);
app.use((err, req, res, _next) => {
  res.status(err.statusCode || 500).json({ error: { message: err.message, code: err.code } });
});

describe('POST /wallet/deposit', () => {
  const originalVaultAddress = process.env.VAULT_ADDRESS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbUpdate.mockResolvedValue(1);
  });

  afterEach(() => {
    process.env.VAULT_ADDRESS = originalVaultAddress;
  });

  test('503s with an honest error when no vault address is configured, instead of returning a fake one', async () => {
    delete process.env.VAULT_ADDRESS;
    User.findByWallet.mockResolvedValue({ id: 1, wallet_address: 'GALICE1234567890', balance: '10' });

    const res = await request(app).post('/wallet/deposit').send({ amount: 5, asset: 'XLM' });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('VAULT_NOT_CONFIGURED');
  });

  test('returns the real configured vault address on success, not a fabricated one', async () => {
    // The address this used to fall back to ('GA2C5RFPE6CXENJUA67TZND6L6SXY67TZND6L6SXY67TZND6L6SXY')
    // was 53 characters — one short of a valid 56-character Stellar G-address.
    process.env.VAULT_ADDRESS = 'G' + 'A'.repeat(55); // 56 chars, valid G-address length
    expect(process.env.VAULT_ADDRESS).toHaveLength(56);

    User.findByWallet.mockResolvedValue({ id: 1, wallet_address: 'GALICE1234567890', balance: '10' });
    TransactionModel.create.mockResolvedValue({ id: 99, type: 'deposit', amount: 5 });

    const res = await request(app).post('/wallet/deposit').send({ amount: 5, asset: 'XLM' });

    expect(res.status).toBe(200);
    expect(res.body.depositAddress).toBe(process.env.VAULT_ADDRESS);
    expect(res.body.balance).toBe(15);
  });

  test('404s when the authenticated wallet has no profile yet', async () => {
    process.env.VAULT_ADDRESS = 'G' + 'A'.repeat(55); // 56 chars, valid G-address length
    User.findByWallet.mockResolvedValue(null);

    const res = await request(app).post('/wallet/deposit').send({ amount: 5, asset: 'XLM' });

    expect(res.status).toBe(404);
  });
});
