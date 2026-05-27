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

