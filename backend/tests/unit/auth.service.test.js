/**
 * Unit tests for auth.service — challenge issuance, SEP-53 signature
 * verification, and JWT issuance.
 */
const { createHash } = require('crypto');
const jwt = require('jsonwebtoken');
const { Keypair } = require('@stellar/stellar-sdk');
const {
  authService,
  ChallengeNotFoundError,
  ChallengeExpiredError,
  InvalidSignatureError,
  AuthNotConfiguredError,
} = require('../../src/services/auth.service');

/** Mirrors how Freighter (and SEP-53-style wallets) actually sign messages. */
function signChallenge(keypair, challenge) {
  const hash = createHash('sha256').update(`Stellar Signed Message:\n${challenge}`, 'utf8').digest();
  return keypair.sign(hash).toString('base64');
}

describe('authService.createChallenge / verifySignature', () => {
  test('verifies a correctly signed challenge and consumes it', () => {
    const keypair = Keypair.random();
    const address = keypair.publicKey();

    const challenge = authService.createChallenge(address);
    const signature = signChallenge(keypair, challenge);

    expect(() => authService.verifySignature(address, signature)).not.toThrow();
  });

  test('rejects a signature from the wrong keypair', () => {
    const signer = Keypair.random();
    const claimedAddress = Keypair.random().publicKey();

    const challenge = authService.createChallenge(claimedAddress);
    const signature = signChallenge(signer, challenge);

    expect(() => authService.verifySignature(claimedAddress, signature)).toThrow(InvalidSignatureError);
  });

  test('rejects a raw-bytes signature (not the SEP-53 wrapped hash real wallets produce)', () => {
    const keypair = Keypair.random();
    const address = keypair.publicKey();
    const challenge = authService.createChallenge(address);

    const rawSignature = keypair.sign(Buffer.from(challenge, 'utf8')).toString('base64');

    expect(() => authService.verifySignature(address, rawSignature)).toThrow(InvalidSignatureError);
  });

  test('throws ChallengeNotFoundError when no challenge is pending', () => {
    const keypair = Keypair.random();
    expect(() => authService.verifySignature(keypair.publicKey(), 'sig')).toThrow(ChallengeNotFoundError);
  });

  test('throws ChallengeExpiredError after the TTL elapses', () => {
    const keypair = Keypair.random();
    const address = keypair.publicKey();
    const now = 1_000_000;

    const challenge = authService.createChallenge(address, now);
    const signature = signChallenge(keypair, challenge);

    expect(() => authService.verifySignature(address, signature, now + 6 * 60 * 1000)).toThrow(
      ChallengeExpiredError
    );
  });

  test('consumes the challenge on success — a replay fails', () => {
    const keypair = Keypair.random();
    const address = keypair.publicKey();
    const challenge = authService.createChallenge(address);
    const signature = signChallenge(keypair, challenge);

    authService.verifySignature(address, signature);
    expect(() => authService.verifySignature(address, signature)).toThrow(ChallengeNotFoundError);
  });

  test('rejects a malformed address instead of throwing an unhandled error', () => {
    expect(() => authService.verifySignature('not-a-real-address', 'sig')).toThrow(ChallengeNotFoundError);
  });
});

describe('authService.issueToken', () => {
  const OLD_ENV = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.JWT_SECRET = OLD_ENV;
  });

  test('throws AuthNotConfiguredError when JWT_SECRET is unset', () => {
    delete process.env.JWT_SECRET;
    expect(() => authService.issueToken({ id: 1, wallet_address: 'GALICE' })).toThrow(AuthNotConfiguredError);
  });

  test('issues a verifiable HS256 token carrying id and walletAddress', () => {
    process.env.JWT_SECRET = 'test-secret';
    const token = authService.issueToken({ id: 7, wallet_address: 'GALICE' });

    const decoded = jwt.verify(token, 'test-secret', { algorithms: ['HS256'] });
    expect(decoded).toEqual(
      expect.objectContaining({ id: 7, walletAddress: 'GALICE', address: 'GALICE' })
    );
  });
});
