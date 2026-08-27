import { describe, it, expect } from 'vitest';
import { runFuzz, runSequence, shrinkToMinimalReproduction } from './fuzzer';
import { createReferenceVaultTarget } from './reference-vault';
import type { FunctionCall, FuzzTarget } from './types';

describe('runSequence', () => {
  it('applies every call in order and reports no failures for a clean sequence', () => {
    const target = createReferenceVaultTarget(false);
    const sequence: FunctionCall[] = [
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 100n } },
      { functionName: 'withdraw', args: { user: 'GADDR_A', amount: 40n } },
    ];

    const outcomes = runSequence(target, sequence);

    expect(outcomes).toHaveLength(2);
    expect(outcomes.every((o) => !o.panicked && o.violatedInvariants.length === 0)).toBe(true);
  });

  it('treats an expected guard rejection (insufficient balance) as a no-op, not a panic, and keeps executing later calls', () => {
    const target = createReferenceVaultTarget(false);
    const sequence: FunctionCall[] = [
      { functionName: 'withdraw', args: { user: 'GADDR_A', amount: 50n } }, // rejected: insufficient balance
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 100n } },
    ];

    const outcomes = runSequence(target, sequence);

    expect(outcomes).toHaveLength(2);
    expect(outcomes[0].rejected).toBe(true);
    expect(outcomes[0].panicked).toBe(false);
    expect(outcomes[0].rejectionMessage).toMatch(/insufficient balance/);
    // The rejected withdraw did not change state, so the following
    // deposit still applies cleanly against a 0 starting balance.
    expect(outcomes[1].rejected).toBe(false);
    expect(outcomes[1].panicked).toBe(false);
  });

  it('treats an unrecognized function name as an unexpected panic (a real harness bug, not a guard rejection)', () => {
    const target = createReferenceVaultTarget(false);
    const sequence: FunctionCall[] = [{ functionName: 'not-a-real-function', args: {} }];

    const outcomes = runSequence(target, sequence);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].panicked).toBe(true);
    expect(outcomes[0].rejected).toBe(false);
    expect(outcomes[0].panicMessage).toMatch(/Unknown function/);
  });

  it('stops at the first invariant violation', () => {
    const target = createReferenceVaultTarget(true); // buggy: allows over-withdraw by 1
    const sequence: FunctionCall[] = [
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 10n } },
      { functionName: 'withdraw', args: { user: 'GADDR_A', amount: 11n } }, // slips through in buggy mode
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 5n } },
    ];

    const outcomes = runSequence(target, sequence);

    expect(outcomes).toHaveLength(2);
    expect(outcomes[1].panicked).toBe(false);
    expect(outcomes[1].violatedInvariants.length).toBeGreaterThan(0);
  });

  it('returns an empty outcome list for an empty sequence', () => {
    const target = createReferenceVaultTarget(false);
    expect(runSequence(target, [])).toEqual([]);
  });
});

describe('shrinkToMinimalReproduction', () => {
  it('returns an empty array when the full sequence never fails', () => {
    const target = createReferenceVaultTarget(false);
    const sequence: FunctionCall[] = [{ functionName: 'deposit', args: { user: 'GADDR_A', amount: 10n } }];
    expect(shrinkToMinimalReproduction(target, sequence)).toEqual([]);
  });

  it('shrinks to the exact prefix ending at the failing call (an unexpected panic)', () => {
    const target = createReferenceVaultTarget(false);
    const sequence: FunctionCall[] = [
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 10n } },
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 5n } },
      { functionName: 'not-a-real-function', args: {} }, // unexpected panic here
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 1n } }, // never reached
    ];

    const minimal = shrinkToMinimalReproduction(target, sequence);

    expect(minimal).toEqual(sequence.slice(0, 3));
  });

  it('shrinks to the exact prefix ending at the failing call (an invariant violation)', () => {
    const target = createReferenceVaultTarget(true); // buggy: allows over-withdraw by 1
    const sequence: FunctionCall[] = [
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 10n } },
      { functionName: 'withdraw', args: { user: 'GADDR_A', amount: 11n } }, // slips through in buggy mode
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 1n } }, // never reached
    ];

    const minimal = shrinkToMinimalReproduction(target, sequence);

    expect(minimal).toEqual(sequence.slice(0, 2));
  });

  it('skips over expected guard rejections when shrinking (they are not part of the failure)', () => {
    const target = createReferenceVaultTarget(true); // buggy: allows over-withdraw by 1
    const sequence: FunctionCall[] = [
      { functionName: 'withdraw', args: { user: 'GADDR_A', amount: 5n } }, // rejected: insufficient balance (no-op)
      { functionName: 'deposit', args: { user: 'GADDR_A', amount: 10n } },
      { functionName: 'withdraw', args: { user: 'GADDR_A', amount: 11n } }, // slips through in buggy mode
    ];

    const minimal = shrinkToMinimalReproduction(target, sequence);

    // The rejected first call is still part of the minimal *prefix* (this
    // shrinker only trims the tail, not no-op calls in the middle — see
    // README Known Limitations) but the reported failure is still exactly
    // the invariant violation from the final call.
    expect(minimal).toEqual(sequence);
  });
});

describe('runFuzz', () => {
  it('passes across many runs against a correct target with no seeded bug', () => {
    const result = runFuzz(createReferenceVaultTarget(false), { runs: 200, seed: 1234, maxSequenceLength: 6 });

    expect(result.passed).toBe(true);
    expect(result.firstFailure).toBeNull();
    expect(result.reproductionSequence).toEqual([]);
    expect(result.totalRuns).toBe(200);
  });

  it('detects the seeded invariant-violation bug in the buggy reference target', () => {
    // A reasonably large run/sequence budget so the buggy withdraw path is
    // very likely to be exercised; the buggy target's bug requires a
    // deposit followed by an over-withdraw, which is common at these sizes.
    const result = runFuzz(createReferenceVaultTarget(true), { runs: 500, seed: 42, maxSequenceLength: 8 });

    expect(result.passed).toBe(false);
    expect(result.firstFailure).not.toBeNull();
    expect(result.reproductionSequence.length).toBeGreaterThan(0);
  });

  it('produces identical results for the same seed (reproducible runs)', () => {
    const options = { runs: 300, seed: 999, maxSequenceLength: 8 };
    const resultA = runFuzz(createReferenceVaultTarget(true), options);
    const resultB = runFuzz(createReferenceVaultTarget(true), options);

    expect(resultA.passed).toBe(resultB.passed);
    expect(resultA.reproductionSequence).toEqual(resultB.reproductionSequence);
  });

  it('produces a reproduction sequence whose replay against a fresh target reproduces the same failure', () => {
    const result = runFuzz(createReferenceVaultTarget(true), { runs: 500, seed: 7, maxSequenceLength: 8 });
    expect(result.passed).toBe(false);

    const replay = runSequence(createReferenceVaultTarget(true), result.reproductionSequence);
    const lastOutcome = replay[replay.length - 1];

    expect(lastOutcome.panicked || lastOutcome.violatedInvariants.length > 0).toBe(true);
  });

  it('respects the requested number of runs when no failure is found', () => {
    const result = runFuzz(createReferenceVaultTarget(false), { runs: 5, seed: 1, maxSequenceLength: 3 });
    expect(result.totalRuns).toBe(5);
  });

  it('defaults maxSequenceLength when not provided', () => {
    const target: FuzzTarget<number> = {
      name: 'noop-target',
      functions: [{ name: 'noop', params: [] }],
      initialState: () => 0,
      apply: (state) => state,
      checkInvariants: () => [],
    };

    const result = runFuzz(target, { runs: 3, seed: 1 });
    expect(result.passed).toBe(true);
  });
});
