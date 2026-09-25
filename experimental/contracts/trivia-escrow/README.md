# trivia-escrow (experimental)

An isolated Soroban contract implementing a multi-player trivia wager pool.
Players stake tokens on a timed quiz round, commit a hash of their answers,
reveal them once the round closes, and the prize pool is split equally
among everyone who scored a perfect answer set. Lives entirely under
`experimental/contracts/trivia-escrow/` and does not touch any production
contract.

## Interface

```
create_round(env, host: Address, token: Address, entry_fee: i128,
             answer_key_hash: BytesN<32>, deadline: u64) -> Result<u64, Error>

submit_commitment(env, player: Address, round_id: u64,
                   answer_commitment: BytesN<32>) -> Result<(), Error>

reveal_answers(env, player: Address, round_id: u64, answers: Vec<u32>,
                salt: BytesN<32>) -> Result<bool, Error>

settle_round(env, round_id: u64) -> Result<Vec<Address>, Error>

get_round_details(env, round_id: u64) -> TriviaRoundSummary
```

`create_round` adds a `token` parameter (the SEP-41 asset used for stakes
and payouts) beyond the issue's minimal signature, since an escrow contract
needs to know what it is escrowing.

All mutating calls (`create_round`, `submit_commitment`, `reveal_answers`)
require and check `require_auth()` on the relevant caller address.
`settle_round` is intentionally permissionless — anyone may trigger
settlement once the deadline has passed, since it only ever pays out to
addresses that already proved eligibility via a valid reveal.

## Scoring model

The contract never sees the plaintext answer key on-chain until reveal
time, and even then it never learns anyone's *correct* answers unless a
player happens to submit them — it only compares hashes. The model chosen
here is a **direct hash-equality model**:

1. Off-chain, the host serializes the correct answers as a sequence of
   4-byte big-endian `u32` question-answer codes concatenated in order
   (question 1's code, then question 2's, etc.) and computes
   `answer_key_hash = SHA-256(serialized_answers)`. This hash is passed to
   `create_round` and stored on-chain; the plaintext key is never revealed
   on-chain.
2. When a player commits, they compute
   `answer_commitment = SHA-256(serialized_answers || salt)` off-chain
   (same serialization, plus a random 32-byte salt to prevent other
   players from brute-forcing a small answer space from the commitment
   alone) and submit only the hash via `submit_commitment`.
3. At reveal time (`reveal_answers`), the player submits their plaintext
   `answers` and `salt`. The contract:
   - Recomputes `SHA-256(serialized_answers || salt)` and requires it to
     equal the stored commitment (`RevealMismatch` otherwise — this
     catches both a wrong/forgotten salt and any attempt to change
     answers after the deadline).
   - Separately recomputes `SHA-256(serialized_answers)` (no salt) and
     compares it to the round's `answer_key_hash`. An exact match means
     "answered every question correctly"; the contract has no notion of
     partial credit under this model.
4. At settlement (`settle_round`), every player whose reveal both matched
   their commitment and matched the answer key is a winner. The pool is
   split evenly among winners (integer division; any remainder from
   non-divisible splits stays in the contract as dust).

**Rollover when nobody qualifies:** if no revealed player has a perfect
score, the round cannot distribute a winner-take-share pot, so instead of
stranding funds in the contract, every player who submitted a commitment
is refunded their entry fee in full. This is a simplification of a true
"rollover to the next round" — implementing an actual cross-round rollover
would require linking rounds together, which is out of scope for this
experimental contract.

This design trades partial-credit scoring for simplicity and testability:
correctness reduces to two hash comparisons, with no on-chain iteration
over individual questions.

## Commit-reveal flow

```
create_round(host, token, entry_fee, answer_key_hash, deadline)
        │
        ▼
submit_commitment(player, round_id, commitment)   [must be before deadline]
        │  (transfers entry_fee from player into escrow)
        ▼
reveal_answers(player, round_id, answers, salt)    [must be after deadline]
        │  (verifies commitment, scores against answer_key_hash)
        ▼
settle_round(round_id)                             [must be after deadline]
        │  (splits pool among perfect scorers, or refunds everyone)
        ▼
get_round_details(round_id)                         [read-only, any time]
```

## Storage

- `instance()`: `RoundCounter` — a single id generator shared by all rounds.
- `persistent()`, TTL bumped on every write (`PERSISTENT_BUMP_LEDGERS`,
  ~30 days at 5s/ledger):
  - `Round(round_id)` — round configuration and running totals.
  - `Commitment(round_id, player)` — a player's commit/reveal state.
  - `Players(round_id)` — list of committed player addresses, used to
    iterate participants at settlement.

## Errors

See `Error` in `src/types.rs` for the full list (invalid input/deadline,
round not found, already settled, submission closed, already
committed/revealed, reveal mismatch, reveal/settlement not yet open,
arithmetic overflow).

## Usage

```bash
cargo test --manifest-path experimental/contracts/trivia-escrow/Cargo.toml
cargo build --manifest-path experimental/contracts/trivia-escrow/Cargo.toml \
    --target wasm32-unknown-unknown --release
```

## Tests

`src/test.rs` covers, using `soroban-sdk` testutils and the SEP-41 token
test client:

- Round creation and commitment registration, including the stake token
  transfer from player to contract.
- Successful reveal and correctness scoring, for both a correct and an
  incorrect answer set.
- Prize pool distribution split equally among multiple winning players,
  and refund-based rollover when nobody qualifies.
- Rejection of: commitments submitted after the deadline, reveals with a
  mismatched salt, reveals attempted before the deadline, settlement
  attempted before the deadline, duplicate commitments, and invalid round
  creation parameters (non-positive entry fee, past deadline).
