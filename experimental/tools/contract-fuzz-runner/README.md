# Contract Fuzz Runner CLI

A Node.js/TypeScript property-based fuzz testing runner that generates
randomized, boundary-value-focused sequences of contract function calls
against a pluggable state model, checks invariants after every call, and
reports a minimal reproduction sequence when it finds a panic or an
invariant violation.

## Features

- **Boundary-Focused Input Generation**: For every parameter type
  (`u32`, `u64`, `u128`, `i128`, `address`, `vec`, `string`) the generator
  is weighted toward edge cases — `0`, `1`, `u32::MAX`/`u64::MAX`, empty
  vectors/strings, max-length strings — mixed with a handful of "normal"
  mid-range values so sequences aren't exclusively degenerate
- **Randomized Call Sequences**: Drives full sequences of calls (e.g.
  `deposit -> deposit -> withdraw -> withdraw`) against a target rather
  than testing each function in isolation, per the issue's example
- **Invariant Checking**: After every call, the target's
  `checkInvariants(state)` is evaluated (e.g. "total vault balance must
  equal sum of user deposits")
- **Minimal Reproduction**: On the first panic or invariant violation, the
  fuzzer shrinks the failing sequence to the shortest prefix that still
  reproduces the same failure and prints it
- **Reproducible Runs**: A deterministic seeded PRNG (mulberry32) means
  `--seed <n>` always reproduces the exact same generated sequences

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
node dist/index.js --contract <name> --runs <n> [--seed <n>] [--max-sequence-length <n>] [--json]
```

**Options:**
- `--contract <name>` (required): Fuzz target to run. Run with no
  arguments to see the list of available targets in `--help` output
- `--runs <n>`: Number of randomized sequences to attempt (default `100`)
- `--seed <n>`: Random seed for reproducible runs (default: current time)
- `--max-sequence-length <n>`: Maximum calls per generated sequence
  (default `8`)
- `--json`: Output the raw result as JSON instead of a formatted report

The process exits with a non-zero code if a failure was found, so it can
be used as a gate in scripts/CI.

### Examples

```bash
# Fuzz the correct reference vault — expected to pass
node dist/index.js --contract reference-vault --runs 200

# Fuzz the intentionally-buggy reference vault — expected to find the
# seeded over-withdraw bug and print a minimal repro
node dist/index.js --contract reference-vault-buggy --runs 200 --seed 42

# Reproduce a specific prior run exactly
node dist/index.js --contract reference-vault-buggy --seed 42 --runs 200
```

Sample output on a discovered failure:

```
🐛 Contract Fuzz Runner
Contract: reference-vault
Seed: 42 | Runs: 200

✗ Failure found!

  Invariant violated: total vault balance (10) does not equal sum of user balances (11)

Minimal reproduction sequence:
  1. deposit(user=GADDR_A, amount=10)
  2. withdraw(user=GADDR_A, amount=11)

Re-run this exact sequence with: --seed 42
```

### Testing

```bash
npm test
```

## Fuzz Target Model

The engine is deliberately decoupled from any specific execution backend
via the `FuzzTarget<TState>` interface (`src/types.ts`):

```ts
interface FuzzTarget<TState> {
  name: string;
  functions: ContractFunctionSpec[];
  initialState: () => TState;
  apply: (state: TState, call: FunctionCall) => TState;
  checkInvariants: (state: TState) => string[]; // [] = all invariants hold
}
```

`apply` distinguishes two kinds of thrown error, which matters for
avoiding false positives:

- **`RejectedCallError`** — the contract's own guards correctly rejected
  the call (e.g. "insufficient balance", a failed auth check, invalid
  input). This mirrors a real Soroban contract's `panic_with_error!` on a
  guarded precondition: the contract did its job by refusing the call, so
  it's not a bug. `runSequence` treats it as a no-op — state does not
  advance, but the sequence keeps going with later calls.
- **A plain `Error`** — an unexpected panic/abort. This *is* treated as a
  failure and stops the sequence, since state may be corrupted.

Without this distinction, a fuzzer would report "failures" for perfectly
correct contracts any time a randomly-generated sequence happens to call
`withdraw` before a matching `deposit` — that was actually a bug caught
in this tool's own test suite during development (see `fuzzer.test.ts`).

Two targets are registered today, both built around an in-memory
deposit/withdraw vault modeled after this repo's Soroban vault-style
contracts (see `contracts/asset-escrow-v3`, `contracts/token-vesting-linear`)
whose core invariant is "total vault balance == sum of user balances" —
exactly the example given in the issue:

- `reference-vault`: the correct implementation, used to confirm the
  fuzzer doesn't produce false positives
- `reference-vault-buggy`: the same vault with a seeded off-by-one bug
  (`withdraw` allows withdrawing one unit more than the caller's balance),
  used to confirm the fuzzer actually detects a real invariant violation
  and produces a minimal reproduction for it (`fuzzer.test.ts` asserts
  this end-to-end)

Adding a new target means implementing `FuzzTarget<TState>` for the
contract's state machine and registering a factory for it in the
`TARGETS` map in `src/index.ts`.

## Known Limitations / Follow-ups

- No target here drives a live deployed Soroban contract over RPC — both
  registered targets are in-memory reference models. Wiring a
  `FuzzTarget` implementation that calls a real contract via
  `@stellar/stellar-sdk`/`soroban-client` (translating `FunctionCall` into
  an actual invocation and reading real ledger state back for
  `checkInvariants`) is the natural next step for fuzzing this repo's
  actual `contracts/*` crates, and is why `--contract` takes an
  in-process registry name rather than a contract address today.
- Shrinking only takes the shortest *prefix* of the failing sequence
  (delta-debugging down to the smallest necessary calls). It does not
  attempt to shrink individual call *arguments* toward a smaller failing
  value (e.g. reducing `amount=999` to the smallest amount that still
  triggers the bug) — sufficient for the "minimal reproduction sequence"
  acceptance criterion, but coarser than a full shrinker.
- Boundary value pools are fixed per type rather than derived from a
  contract's actual declared valid ranges (e.g. a `u32` parameter that a
  real contract additionally constrains to `1..=100`) — a real-contract
  target would want to supply its own per-parameter boundary hints.

## License

MIT
