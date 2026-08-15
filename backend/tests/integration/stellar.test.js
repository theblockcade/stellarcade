/**
 * Integration tests for stellar.service.js
 *
 * These tests mock only the Horizon HTTP call (server.submitTransaction) while
 * letting the real XDR parsing path run to verify the two layers compose
 * correctly.  A valid Stellar testnet transaction envelope is used for
 * happy-path tests; intentionally malformed strings exercise the error path.
 */
'use strict';

// Mock only the config module so we control the server instance while still
// loading the real service implementation.
jest.mock('../../src/config/stellar', () => {
  const StellarSdk = jest.requireActual('@stellar/stellar-sdk');
  return {
    server: { submitTransaction: jest.fn() },
    network: 'testnet',
    passphrase: StellarSdk.Networks.TESTNET,
  };
});

const StellarSdk = require('@stellar/stellar-sdk');
const { server } = require('../../src/config/stellar');
const { submitTransaction, STELLAR_ERRORS } = require('../../src/services/stellar.service');

// ---------------------------------------------------------------------------
// Build a minimal but structurally valid Stellar transaction XDR for tests
// ---------------------------------------------------------------------------

/**
 * Creates a real, signed transaction envelope XDR on TESTNET.
 * The transaction has one Payment operation and is signed by a known keypair.
 * It will be rejected by a real network (sequence number is fake) but XDR
 * parsing will succeed.
 */
const buildValidXDR = () => {
  const keypair = StellarSdk.Keypair.fromSecret(
    'SCYTB56TGB76PRO74RTAA7RDKONFJDGXIWNX3M7VIF5JYYDRAEZ6RH2Q'
  );
  const sourceAccount = new StellarSdk.Account(keypair.publicKey(), '1000');
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: 'GCL3XXKSD2NTRWXS4SCWRZVXXBESRTQJW4E6XRQL2BLOWKEVGTAMEILN',
        asset: StellarSdk.Asset.native(),
        amount: '1',
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  return tx.toEnvelope().toXDR('base64');
};

const VALID_XDR = buildValidXDR();

const HORIZON_SUCCESS = {
  hash: 'deadbeef1234567890abcdef',
  ledger: 99,
  successful: true,
  envelope_xdr: VALID_XDR,
  result_xdr: 'AAAAAAAAAGQ=',
  result_meta_xdr: '',
  paging_token: '',
};

const makeHorizonError = ({ status, resultCodes = null, title = null, errCode = null } = {}) => {
  const err = new Error(title || `Horizon ${status}`);
  err.response = {
    status,
    data: {
      title: title || `Error ${status}`,
      ...(resultCodes ? { extras: { result_codes: resultCodes } } : {}),
    },
  };
  if (errCode) err.code = errCode;
  return err;
};

// ---------------------------------------------------------------------------

describe('stellar.service integration — successful submission', () => {
  beforeEach(() => jest.clearAllMocks());

  test('parses valid XDR and returns full success payload', async () => {
    server.submitTransaction.mockResolvedValue(HORIZON_SUCCESS);

    const result = await submitTransaction(VALID_XDR);

    expect(result.status).toBe('success');
    expect(result.hash).toBe('deadbeef1234567890abcdef');
    expect(result.ledger).toBe(99);
    expect(result.successful).toBe(true);
    expect(result.envelopeXDR).toBe(VALID_XDR);
    expect(result.resultXDR).toBe('AAAAAAAAAGQ=');
    expect(result.errorCode).toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.resultCodes).toBeNull();
  });

  test('passes the parsed Transaction object (not the XDR string) to server.submitTransaction', async () => {
    server.submitTransaction.mockResolvedValue(HORIZON_SUCCESS);

    await submitTransaction(VALID_XDR);

    const passedArg = server.submitTransaction.mock.calls[0][0];
    // The parsed object should be a Transaction/FeeBumpTransaction, not a string
    expect(typeof passedArg).not.toBe('string');
    expect(passedArg).toHaveProperty('signatures');
  });
});

// ---------------------------------------------------------------------------

describe('stellar.service integration — invalid XDR', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns INVALID_XDR for an empty string', async () => {
    const result = await submitTransaction('');

    expect(result.status).toBe('error');
    expect(result.errorCode).toBe(STELLAR_ERRORS.INVALID_XDR);
    expect(server.submitTransaction).not.toHaveBeenCalled();
  });

  test('returns INVALID_XDR for a random non-base64 string', async () => {
    const result = await submitTransaction('not-xdr-at-all!!!');

    expect(result.status).toBe('error');
    expect(result.errorCode).toBe(STELLAR_ERRORS.INVALID_XDR);
    expect(server.submitTransaction).not.toHaveBeenCalled();
  });

  test('returns INVALID_XDR for valid base64 that is not a transaction envelope', async () => {
    // base64("hello world")
    const result = await submitTransaction(Buffer.from('hello world').toString('base64'));

    expect(result.status).toBe('error');
    expect(result.errorCode).toBe(STELLAR_ERRORS.INVALID_XDR);
    expect(server.submitTransaction).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('stellar.service integration — network failures', () => {
  beforeEach(() => jest.clearAllMocks());

  test('maps on-chain tx failure (400 + result_codes) to TX_FAILED', async () => {
    const codes = { transaction: 'tx_bad_seq', operations: [] };
    server.submitTransaction.mockRejectedValue(
      makeHorizonError({ status: 400, resultCodes: codes, title: 'Transaction Failed' })
    );

    const result = await submitTransaction(VALID_XDR);

    expect(result.status).toBe('error');
    expect(result.errorCode).toBe(STELLAR_ERRORS.TX_FAILED);
    expect(result.resultCodes).toEqual(codes);
    expect(result.hash).toBeNull();
  });

  test('maps 408 to TIMEOUT', async () => {
    server.submitTransaction.mockRejectedValue(makeHorizonError({ status: 408 }));

    const result = await submitTransaction(VALID_XDR);

    expect(result.errorCode).toBe(STELLAR_ERRORS.TIMEOUT);
  });

  test('maps ECONNABORTED (axios timeout) to TIMEOUT', async () => {
    const err = new Error('timeout of 30000ms exceeded');
    err.code = 'ECONNABORTED';
    err.response = {};
    server.submitTransaction.mockRejectedValue(err);

    const result = await submitTransaction(VALID_XDR);

    expect(result.errorCode).toBe(STELLAR_ERRORS.TIMEOUT);
  });

  test('maps 429 to RATE_LIMITED', async () => {
    server.submitTransaction.mockRejectedValue(makeHorizonError({ status: 429 }));

    const result = await submitTransaction(VALID_XDR);

    expect(result.errorCode).toBe(STELLAR_ERRORS.RATE_LIMITED);
  });

  test('maps 500 to SERVER_ERROR', async () => {
    server.submitTransaction.mockRejectedValue(makeHorizonError({ status: 500 }));

    const result = await submitTransaction(VALID_XDR);

    expect(result.errorCode).toBe(STELLAR_ERRORS.SERVER_ERROR);
  });

  test('maps no-response network error to NETWORK_ERROR', async () => {
    const err = new Error('connect ECONNREFUSED');
    server.submitTransaction.mockRejectedValue(err);

    const result = await submitTransaction(VALID_XDR);

    expect(result.errorCode).toBe(STELLAR_ERRORS.NETWORK_ERROR);
    expect(result.errorMessage).toContain('ECONNREFUSED');
  });
});

// ---------------------------------------------------------------------------

describe('stellar.service integration — result shape contract', () => {
  beforeEach(() => jest.clearAllMocks());

  test('success result always has null error fields', async () => {
    server.submitTransaction.mockResolvedValue(HORIZON_SUCCESS);
    const result = await submitTransaction(VALID_XDR);

    expect(result.errorCode).toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.resultCodes).toBeNull();
  });

  test('error result always has null hash/ledger/xdr fields', async () => {
    server.submitTransaction.mockRejectedValue(makeHorizonError({ status: 500 }));
    const result = await submitTransaction(VALID_XDR);

    expect(result.hash).toBeNull();
    expect(result.ledger).toBeNull();
    expect(result.envelopeXDR).toBeNull();
    expect(result.resultXDR).toBeNull();
  });

  test('all expected keys are present on success', async () => {
    server.submitTransaction.mockResolvedValue(HORIZON_SUCCESS);
    const result = await submitTransaction(VALID_XDR);

    expect(result).toEqual(
      expect.objectContaining({
        status: expect.any(String),
        hash: expect.any(String),
        ledger: expect.any(Number),
        successful: expect.any(Boolean),
        envelopeXDR: expect.any(String),
        resultXDR: expect.any(String),
        errorCode: null,
        errorMessage: null,
        resultCodes: null,
      })
    );
  });

  test('all expected keys are present on error', async () => {
    server.submitTransaction.mockRejectedValue(makeHorizonError({ status: 500 }));
    const result = await submitTransaction(VALID_XDR);

    expect(result).toEqual(
      expect.objectContaining({
        status: 'error',
        hash: null,
        ledger: null,
        successful: false,
        envelopeXDR: null,
        resultXDR: null,
        errorCode: expect.any(String),
        errorMessage: expect.any(String),
      })
    );
  });
});
