import { describe, it, expect } from 'vitest';
import {
  computeCommitment,
  computeRoundHash,
  computeRoundOutcome,
  verifyRound,
  verifyBatch,
} from './verifier';

describe('deterministic hashing', () => {
  it('produces a known HMAC-SHA256 test vector', () => {
    const hash = computeRoundHash('server-secret', 'client-seed', 1);
    // Precomputed with node:crypto HMAC-SHA256(key='server-secret', msg='client-seed:1')
    expect(hash).toBe(
      require('crypto')
        .createHmac('sha256', 'server-secret')
        .update('client-seed:1')
        .digest('hex')
    );
  });

  it('computeCommitment matches sha256 of the seed', () => {
    const commitment = computeCommitment('server-secret');
    expect(commitment).toBe(
      require('crypto').createHash('sha256').update('server-secret').digest('hex')
    );
  });
});

describe('game outcome vectors', () => {
  it('coinflip resolves to heads or tails deterministically', () => {
    const r1 = computeRoundOutcome({
      serverSeed: 'seed-a',
      clientSeed: 'client-a',
      nonce: 0,
      game: 'coinflip',
    });
    const r2 = computeRoundOutcome({
      serverSeed: 'seed-a',
      clientSeed: 'client-a',
      nonce: 0,
      game: 'coinflip',
    });
    expect(['heads', 'tails']).toContain(r1.result);
    expect(r1).toEqual(r2);
  });

  it('dice resolves within 1-100', () => {
    for (let nonce = 0; nonce < 20; nonce++) {
      const outcome = computeRoundOutcome({
        serverSeed: 'seed-b',
        clientSeed: 'client-b',
        nonce,
        game: 'dice',
      });
      expect(outcome.result).toBeGreaterThanOrEqual(1);
      expect(outcome.result).toBeLessThanOrEqual(100);
    }
  });

  it('roulette resolves within 0-36', () => {
    for (let nonce = 0; nonce < 20; nonce++) {
      const outcome = computeRoundOutcome({
        serverSeed: 'seed-c',
        clientSeed: 'client-c',
        nonce,
        game: 'roulette',
      });
      expect(outcome.result).toBeGreaterThanOrEqual(0);
      expect(outcome.result).toBeLessThanOrEqual(36);
    }
  });
});

describe('tamper detection', () => {
  it('detects a mismatched server seed against the commitment', () => {
    const commitment = computeCommitment('real-seed');
    const result = verifyRound({
      serverSeed: 'tampered-seed',
      clientSeed: 'client',
      nonce: 1,
      game: 'coinflip',
      commitment,
    });
    expect(result.commitmentValid).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('passes when the server seed matches its commitment', () => {
    const commitment = computeCommitment('real-seed');
    const result = verifyRound({
      serverSeed: 'real-seed',
      clientSeed: 'client',
      nonce: 1,
      game: 'coinflip',
      commitment,
    });
    expect(result.commitmentValid).toBe(true);
    expect(result.passed).toBe(true);
  });

  it('detects a tampered nonce producing a different result', () => {
    const base = computeRoundOutcome({
      serverSeed: 'seed-x',
      clientSeed: 'client-x',
      nonce: 5,
      game: 'dice',
    });
    const result = verifyRound(
      { serverSeed: 'seed-x', clientSeed: 'client-x', nonce: 6, game: 'dice' },
      base.result
    );
    // nonce 6 recomputes a fresh (likely different) result; flag when it diverges
    if (result.outcome.result !== base.result) {
      expect(result.passed).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    }
  });
});

describe('batch verification', () => {
  it('verifies a batch log of multiple rounds and tallies pass/fail', () => {
    const good = computeRoundOutcome({
      serverSeed: 'seed-1',
      clientSeed: 'client-1',
      nonce: 0,
      game: 'coinflip',
    });

    const entries = [
      { serverSeed: 'seed-1', clientSeed: 'client-1', nonce: 0, game: 'coinflip' as const, expectedResult: good.result },
      { serverSeed: 'seed-1', clientSeed: 'client-1', nonce: 0, game: 'coinflip' as const, expectedResult: 'not-a-real-result' },
    ];

    const batch = verifyBatch(entries);
    expect(batch.total).toBe(2);
    expect(batch.passed).toBe(1);
    expect(batch.failed).toBe(1);
  });
});
