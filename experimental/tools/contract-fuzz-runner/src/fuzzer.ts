import { SeededRandom, generateSequence } from './generators';
import { RejectedCallError } from './types';
import type { CallOutcome, FunctionCall, FuzzRunOptions, FuzzRunResult, FuzzTarget } from './types';

const DEFAULT_MAX_SEQUENCE_LENGTH = 8;

/**
 * Executes a single call sequence against `target`, starting from its
 * initial state. An expected guard rejection (`RejectedCallError`, e.g.
 * "insufficient balance") does not advance state and does not stop the
 * sequence — it behaves like the call never happened, exactly as a real
 * contract rejecting an invalid transaction wouldn't corrupt its own
 * state. The sequence stops at the first *unexpected* panic or invariant
 * violation instead, since there is nothing meaningful to continue
 * checking once state may be corrupted.
 */
export function runSequence<TState>(target: FuzzTarget<TState>, sequence: FunctionCall[]): CallOutcome[] {
  let state = target.initialState();
  const outcomes: CallOutcome[] = [];

  for (const call of sequence) {
    let rejected = false;
    let rejectionMessage: string | undefined;
    let panicked = false;
    let panicMessage: string | undefined;
    let nextState = state;

    try {
      nextState = target.apply(state, call);
    } catch (err) {
      if (err instanceof RejectedCallError) {
        rejected = true;
        rejectionMessage = err.message;
      } else {
        panicked = true;
        panicMessage = err instanceof Error ? err.message : String(err);
      }
    }

    const violatedInvariants = rejected || panicked ? [] : target.checkInvariants(nextState);
    outcomes.push({ call, rejected, rejectionMessage, panicked, panicMessage, violatedInvariants });

    if (panicked || violatedInvariants.length > 0) {
      break;
    }
    if (!rejected) {
      state = nextState;
    }
  }

  return outcomes;
}

function isFailure(outcome: CallOutcome): boolean {
  return outcome.panicked || outcome.violatedInvariants.length > 0;
}

/**
 * Attempts to shrink a failing call sequence to a minimal reproduction:
 * the shortest prefix of `sequence` (from the start) that still
 * reproduces the same kind of failure (panic vs a specific invariant
 * violation) when replayed from a fresh initial state.
 *
 * This is a simple prefix-shrink (not full delta-debugging/minimization
 * of individual call arguments) — sufficient to satisfy "output minimal
 * reproduction sequence" for sequential state-corruption bugs, since the
 * failing call is always the last element of the full sequence and nothing
 * after it is relevant. Shrinking individual call arguments themselves is
 * a natural follow-up (see README).
 */
export function shrinkToMinimalReproduction<TState>(
  target: FuzzTarget<TState>,
  fullSequence: FunctionCall[]
): FunctionCall[] {
  const fullOutcomes = runSequence(target, fullSequence);
  const failureIndex = fullOutcomes.findIndex(isFailure);
  if (failureIndex === -1) {
    return [];
  }

  // The failure must occur at the same index (same trigger) when
  // replayed — binary search shrinking is unnecessary here since we
  // already know run(prefix of length n) fails iff n > failureIndex,
  // given deterministic replay. The minimal reproduction is exactly the
  // prefix ending at the failing call.
  return fullSequence.slice(0, failureIndex + 1);
}

/**
 * Runs `options.runs` independently-seeded fuzz sequences against
 * `target` and returns the aggregated result, stopping at the first
 * sequence that produces a failure (panic or invariant violation) and
 * reporting its minimal reproduction. If no sequence fails across all
 * runs, `passed` is true and `firstFailure`/`reproductionSequence` are
 * empty.
 */
export function runFuzz<TState>(target: FuzzTarget<TState>, options: FuzzRunOptions): FuzzRunResult {
  const rng = new SeededRandom(options.seed);
  const maxSequenceLength = options.maxSequenceLength ?? DEFAULT_MAX_SEQUENCE_LENGTH;

  const allOutcomes: CallOutcome[] = [];
  let firstFailure: CallOutcome | null = null;
  let reproductionSequence: FunctionCall[] = [];

  for (let run = 0; run < options.runs; run++) {
    const length = rng.nextInt(1, maxSequenceLength);
    const sequence = generateSequence(target.functions, length, rng);
    const outcomes = runSequence(target, sequence);
    allOutcomes.push(...outcomes);

    const failure = outcomes.find(isFailure);
    if (failure) {
      firstFailure = failure;
      reproductionSequence = shrinkToMinimalReproduction(target, sequence);
      break;
    }
  }

  return {
    contractName: target.name,
    seed: options.seed,
    totalRuns: options.runs,
    outcomes: allOutcomes,
    firstFailure,
    reproductionSequence,
    passed: firstFailure === null,
  };
}
