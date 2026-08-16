/**
 * Wallet-signature login. Proves control of a Stellar address without ever
 * seeing a secret key: the client signs a server-issued challenge with its
 * wallet, the server verifies that signature against the claimed address,
 * then issues a JWT. Nothing else in this app has ever actually completed
 * this loop — every JWT-gated route (deposit, withdraw, playGame) has been
 * unreachable in production because no login flow existed to hand out a
 * token in the first place.
 */
const { randomBytes, createHash } = require('crypto');
const jwt = require('jsonwebtoken');
const { Keypair } = require('@stellar/stellar-sdk');

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const JWT_EXPIRES_IN = '7d';

/** In-memory, single-instance — same tradeoff the bot's own SessionLinker
 * already makes for the identical problem. A challenge is short-lived and
 * one-time-use, so losing it on a restart just means "sign in again". */
const challenges = new Map();

class ChallengeNotFoundError extends Error {
  constructor() {
    super('No pending login challenge for this address — request a new one.');
    this.name = 'ChallengeNotFoundError';
    this.statusCode = 400;
    this.code = 'CHALLENGE_NOT_FOUND';
  }
}

class ChallengeExpiredError extends Error {
  constructor() {
    super('Login challenge expired — request a new one.');
    this.name = 'ChallengeExpiredError';
    this.statusCode = 400;
    this.code = 'CHALLENGE_EXPIRED';
  }
}

class InvalidSignatureError extends Error {
  constructor() {
    super('Signature does not verify against the given address.');
    this.name = 'InvalidSignatureError';
    this.statusCode = 401;
    this.code = 'INVALID_SIGNATURE';
  }
}

class AuthNotConfiguredError extends Error {
  constructor() {
    super('Login is not available: JWT_SECRET is not configured.');
    this.name = 'AuthNotConfiguredError';
    this.statusCode = 503;
    this.code = 'AUTH_NOT_CONFIGURED';
  }
}

/**
 * Wallets (Freighter et al.) that implement signMessage don't sign raw
 * bytes — they sign sha256("Stellar Signed Message:\n" + message), the
 * same convention as SEP-53 and Ethereum's personal_sign.
 */
function stellarSignedMessageHash(message) {
  return createHash('sha256').update(`Stellar Signed Message:\n${message}`, 'utf8').digest();
}

const authService = {
  createChallenge(address, now = Date.now()) {
    const challenge = `Sign in to StellarCade\n\nNonce: ${randomBytes(16).toString('hex')}`;
    challenges.set(address, { challenge, expiresAt: now + CHALLENGE_TTL_MS });
    return challenge;
  },

  /**
   * Verifies `signatureBase64` was produced by `address`'s key over the
   * pending challenge for that address, then consumes the challenge (a
   * verified challenge can't be replayed). Throws on any failure; callers
   * are expected to let that propagate to an error-handling middleware.
   */
  verifySignature(address, signatureBase64, now = Date.now()) {
    const record = challenges.get(address);
    if (!record) {
      throw new ChallengeNotFoundError();
    }
    if (now > record.expiresAt) {
      challenges.delete(address);
      throw new ChallengeExpiredError();
    }

    let valid = false;
    try {
      const keypair = Keypair.fromPublicKey(address);
      const signature = Buffer.from(signatureBase64, 'base64');
      valid = keypair.verify(stellarSignedMessageHash(record.challenge), signature);
    } catch {
      valid = false;
    }

    if (!valid) {
      throw new InvalidSignatureError();
    }

    challenges.delete(address);
  },

  /**
   * @param {{ id: number, wallet_address: string }} user
   * @returns {string} a signed HS256 JWT
   */
  issueToken(user) {
    if (!process.env.JWT_SECRET) {
      throw new AuthNotConfiguredError();
    }

    return jwt.sign(
      { id: user.id, walletAddress: user.wallet_address, address: user.wallet_address },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN }
    );
  },
};

module.exports = {
  authService,
  ChallengeNotFoundError,
  ChallengeExpiredError,
  InvalidSignatureError,
  AuthNotConfiguredError,
};
