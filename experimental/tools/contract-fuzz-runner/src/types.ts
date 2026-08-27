/** A boundary-focused value the generator can produce for a numeric parameter. */
export type BoundaryValue = number | bigint;

export type ParamType = 'u32' | 'u64' | 'u128' | 'i128' | 'address' | 'vec' | 'string';

export interface ParamSpec {
  name: string;
  type: ParamType;
}

/** One callable operation on the fuzz target, e.g. `deposit(amount: u128)`. */
export interface ContractFunctionSpec {
  name: string;
  params: ParamSpec[];
}

/**
 * Thrown by `FuzzTarget.apply` when a call is *expectedly* rejected by the
 * contract's own input validation or authorization guards — e.g.
 * "insufficient balance" on a withdraw, or a negative amount rejected
 * before any state change. This mirrors a real Soroban contract's
 * `panic_with_error!` on a guarded precondition: the contract is working
 * correctly by refusing the call, so it is not a fuzzing "find."
 *
 * `apply` should let a plain `Error` propagate instead (not this class)
 * for anything that indicates an actual bug. Only a `RejectedCallError`
 * is treated as a no-op (state unchanged, sequence continues) by
 * `runSequence`; any other thrown error is treated as an unexpected panic
 * and fails the run.
 */
export class RejectedCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RejectedCallError';
  }
}

/**
 * A pluggable model of the contract under test. `apply` executes one
 * call against whatever state representation the target uses and
 * returns the new state. It should:
 *  - throw a {@link RejectedCallError} for a call the contract's own
 *    guards correctly reject (bad input, insufficient balance, a failed
 *    auth check, etc.) — this does not count as a fuzzing failure, and
 *    the sequence continues from the unchanged prior state;
 *  - throw (or let propagate) a plain `Error` to simulate an unexpected
 *    panic/abort — this *does* count as a failure;
 *  - otherwise return the new state.
 * `checkInvariants` returns a list of violated invariant descriptions
 * for a given state (empty = all invariants hold).
 *
 * This indirection is what lets the fuzz engine be exercised and tested
 * fully offline against an in-memory reference model — see
 * `src/reference-vault.ts` — without requiring a live Soroban RPC
 * connection to a deployed contract.
 */
export interface FuzzTarget<TState> {
  name: string;
  functions: ContractFunctionSpec[];
  initialState: () => TState;
  apply: (state: TState, call: FunctionCall) => TState;
  checkInvariants: (state: TState) => string[];
}

export interface FunctionCall {
  functionName: string;
  args: Record<string, BoundaryValue | string>;
}

export interface CallOutcome {
  call: FunctionCall;
  /** True if the call was expectedly rejected by the target's own guards (see {@link RejectedCallError}). State does not advance. */
  rejected: boolean;
  rejectionMessage?: string;
  /** True if `apply` threw something other than a `RejectedCallError` (an unexpected panic/abort). */
  panicked: boolean;
  panicMessage?: string;
  /** Invariant violation descriptions detected after this call, if any. */
  violatedInvariants: string[];
}

export interface FuzzRunResult {
  contractName: string;
  seed: number;
  totalRuns: number;
  /** All outcomes across the run, in call order. */
  outcomes: CallOutcome[];
  /** The first outcome (if any) where a panic or invariant violation occurred. */
  firstFailure: CallOutcome | null;
  /** Minimal reproduction sequence of calls leading up to and including the first failure. */
  reproductionSequence: FunctionCall[];
  passed: boolean;
}

export interface FuzzRunOptions {
  runs: number;
  seed: number;
  /** Max calls per generated sequence before giving up on finding a shorter failing prefix. */
  maxSequenceLength?: number;
}
