# map-voting

## Public Methods

### `init`
Initialize the contract. May only be called once.

```rust
pub fn init(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `upsert_round`
Write or update a voting round. Admin only.

```rust
pub fn upsert_round(env: Env, admin: Address, round_id: u32, eligible_voters: u32, votes_cast: u32, round_active: bool, tiebreak_required: bool, tiebreak_window_start: u32, tiebreak_window_end: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `round_id` | `u32` |
| `eligible_voters` | `u32` |
| `votes_cast` | `u32` |
| `round_active` | `bool` |
| `tiebreak_required` | `bool` |
| `tiebreak_window_start` | `u32` |
| `tiebreak_window_end` | `u32` |

#### Return Type

`Result<(), Error>`

### `ballot_participation_snapshot`
Return a ballot participation snapshot for `round_id`.  Unknown round ids return `exists = false` with zeroed fields. `participation_bps` is 0 when `eligible_voters` is zero.

```rust
pub fn ballot_participation_snapshot(env: Env, round_id: u32) -> BallotParticipationSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `round_id` | `u32` |

#### Return Type

`BallotParticipationSnapshot`

### `tiebreak_window`
Return tiebreak-window details for `round_id`.  Unknown round ids return `exists = false` with zeroed fields. `window_open` is computed against the current ledger sequence: `window_start <= current_ledger < window_end`.

```rust
pub fn tiebreak_window(env: Env, round_id: u32) -> TiebreakWindow
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `round_id` | `u32` |

#### Return Type

`TiebreakWindow`

