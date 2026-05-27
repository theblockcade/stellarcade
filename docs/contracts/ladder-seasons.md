# ladder-seasons

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

### `upsert_season`
Write or update a season record. Admin only.  Existing records are fully replaced so callers can update individual fields by reading first and re-submitting the modified struct.

```rust
pub fn upsert_season(env: Env, admin: Address, season_id: u32, total_participants: u32, top_score: u32, ended_at_ledger: u32, was_paused: bool, cutoff_score: u32, cutoff_rank: u32, demotion_window_end: u32, demotion_window_active: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `season_id` | `u32` |
| `total_participants` | `u32` |
| `top_score` | `u32` |
| `ended_at_ledger` | `u32` |
| `was_paused` | `bool` |
| `cutoff_score` | `u32` |
| `cutoff_rank` | `u32` |
| `demotion_window_end` | `u32` |
| `demotion_window_active` | `bool` |

#### Return Type

`Result<(), Error>`

### `season_transition_snapshot`
Return a transition snapshot for `season_id`.  Unknown season ids return `exists = false` with zeroed numeric fields. Paused seasons are surfaced via `was_paused = true`.

```rust
pub fn season_transition_snapshot(env: Env, season_id: u32) -> SeasonTransitionSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `season_id` | `u32` |

#### Return Type

`SeasonTransitionSnapshot`

### `demotion_cutoff`
Return the demotion cutoff for `season_id`.  Unknown season ids return `exists = false` with zeroed numeric fields. When `demotion_window_active` is `false` the window has closed and no demotions will be processed.

```rust
pub fn demotion_cutoff(env: Env, season_id: u32) -> DemotionCutoff
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `season_id` | `u32` |

#### Return Type

`DemotionCutoff`

