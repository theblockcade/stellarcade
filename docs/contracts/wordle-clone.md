# wordle-clone

Puzzle metadata and result summary.

## Public Methods

### `init`
Initialize the contract. May only be called once.  Stores admin, prize pool contract address, and balance contract address in instance storage. Subsequent calls return `AlreadyInitialized`.

```rust
pub fn init(env: Env, admin: Address, prize_pool_contract: Address, balance_contract: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `prize_pool_contract` | `Address` |
| `balance_contract` | `Address` |

#### Return Type

`Result<(), Error>`

### `create_daily_puzzle`
Create a new daily puzzle. Admin only.  `puzzle_id` must be unique. `answer_commitment` is `SHA-256(answer_bytes)` computed off-chain. The plaintext answer is never stored until the admin calls `reveal_answer`.  Emits `PuzzleCreated`.

```rust
pub fn create_daily_puzzle(env: Env, puzzle_id: u64, answer_commitment: BytesN<32>) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `puzzle_id` | `u64` |
| `answer_commitment` | `BytesN<32>` |

#### Return Type

`Result<(), Error>`

### `submit_attempt`
Submit a 5-letter guess for an open puzzle.  A player may submit up to `MAX_ATTEMPTS` (6) guesses. Guesses must be exactly `WORD_LENGTH` (5) bytes. Scores are computed after finalization; the `scores` field is empty until then.  Emits `AttemptSubmitted`.

```rust
pub fn submit_attempt(env: Env, player: Address, puzzle_id: u64, attempt: Bytes) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `puzzle_id` | `u64` |
| `attempt` | `Bytes` |

#### Return Type

`Result<(), Error>`

### `reveal_answer`
Reveal the plaintext answer for an open puzzle. Admin only.  Verifies `SHA-256(answer) == answer_commitment`. Transitions the puzzle to `Revealed` state; no new player guesses are accepted after this call. Must be called before `finalize_result`.

```rust
pub fn reveal_answer(env: Env, puzzle_id: u64, answer: Bytes) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `puzzle_id` | `u64` |
| `answer` | `Bytes` |

#### Return Type

`Result<(), Error>`

### `finalize_result`
Score all player attempts and record winners. Admin only.  The `player` parameter is included per the issue interface; the contract scores ALL players in a single pass for consistency, then transitions the puzzle to `Finalized`. Must be called after `reveal_answer`.  Iterates all submissions (bounded by `MAX_PLAYERS_PER_PUZZLE × MAX_ATTEMPTS`). A player is a winner if any of their attempts matches the answer exactly.  Emits `PuzzleFinalized`.

```rust
pub fn finalize_result(env: Env, player: Address, puzzle_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `puzzle_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `get_attempts`
Return all attempts (with scores after finalization) for a player.

```rust
pub fn get_attempts(env: Env, player: Address, puzzle_id: u64) -> Vec<Attempt>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `puzzle_id` | `u64` |

#### Return Type

`Vec<Attempt>`

### `get_puzzle`
Returns puzzle metadata, or `None` if not found.

```rust
pub fn get_puzzle(env: Env, puzzle_id: u64) -> Option<PuzzleData>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `puzzle_id` | `u64` |

#### Return Type

`Option<PuzzleData>`

### `is_winner`
Returns `true` if the player solved the puzzle.

```rust
pub fn is_winner(env: Env, puzzle_id: u64, player: Address) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `puzzle_id` | `u64` |
| `player` | `Address` |

#### Return Type

`bool`

### `get_puzzle_snapshot`
Return a compact puzzle snapshot for restoring in-progress or completed play.

```rust
pub fn get_puzzle_snapshot(env: Env, player: Address, puzzle_id: u64) -> PuzzleSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `puzzle_id` | `u64` |

#### Return Type

`PuzzleSnapshot`

### `score_guess`
Score a guess against the answer using the standard Wordle algorithm.  1. First pass: mark exact matches (CORRECT). 2. Second pass: for remaining positions, check if the guess letter exists in the remaining answer characters (PRESENT), consuming each answer letter at most once.

```rust
pub fn score_guess(env: &Env, guess: &Bytes, answer: &Bytes) -> Vec<u32>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `&Env` |
| `guess` | `&Bytes` |
| `answer` | `&Bytes` |

#### Return Type

`Vec<u32>`

