# arena-ladder

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

### `upsert_bracket`
Write or update a bracket record. Admin only.  Existing records are fully replaced. Callers may read, modify, then re-submit to update individual fields.

```rust
pub fn upsert_bracket(env: Env, admin: Address, bracket_id: u32, players_in_bracket: u32, elimination_threshold: u32, pressure_score: u32, window_open_ledger: u32, window_close_ledger: u32, min_rank_for_promotion: u32, window_active: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `bracket_id` | `u32` |
| `players_in_bracket` | `u32` |
| `elimination_threshold` | `u32` |
| `pressure_score` | `u32` |
| `window_open_ledger` | `u32` |
| `window_close_ledger` | `u32` |
| `min_rank_for_promotion` | `u32` |
| `window_active` | `bool` |

#### Return Type

`Result<(), Error>`

### `bracket_pressure_snapshot`
Return the bracket pressure snapshot for `bracket_id`.  Unknown bracket ids return `exists = false` with zeroed numeric fields. `is_critical` is `true` when `players_in_bracket <= elimination_threshold`.

```rust
pub fn bracket_pressure_snapshot(env: Env, bracket_id: u32) -> BracketPressureSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bracket_id` | `u32` |

#### Return Type

`BracketPressureSnapshot`

### `promotion_window`
Return the promotion window for `bracket_id`.  Unknown bracket ids return `exists = false` with zeroed numeric fields. `window_active` is `false` when the window has been administratively closed, regardless of ledger range.

```rust
pub fn promotion_window(env: Env, bracket_id: u32) -> PromotionWindow
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bracket_id` | `u32` |

#### Return Type

`PromotionWindow`

### `arena_ranking_summary`
Return the arena ranking summary.  Aggregates data across all brackets. Returns zero-state when no brackets exist.

```rust
pub fn arena_ranking_summary(env: Env) -> ArenaRankingSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ArenaRankingSummary`

### `season_cutoff_accessor`
Return the season cutoff accessor for a given season.  Unknown seasons return `is_season_active = false` with zeroed fields.

```rust
pub fn season_cutoff_accessor(env: Env, season_id: u32) -> SeasonCutoffAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `season_id` | `u32` |

#### Return Type

`SeasonCutoffAccessor`

### `set_season_cutoff`
Set the season cutoff ledger for a season. Admin only.

```rust
pub fn set_season_cutoff(env: Env, admin: Address, season_id: u32, cutoff_ledger: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `season_id` | `u32` |
| `cutoff_ledger` | `u32` |

#### Return Type

`Result<(), Error>`

