# mission-pass

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

### `upsert_pass`
Write or update a pass record. Admin only.  Existing records are fully replaced. Callers may read, modify, then re-submit to update individual fields.

```rust
pub fn upsert_pass(env: Env, admin: Address, pass_id: u32, total_missions: u32, completed_missions: u32, next_unlock_threshold: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `pass_id` | `u32` |
| `total_missions` | `u32` |
| `completed_missions` | `u32` |
| `next_unlock_threshold` | `u32` |

#### Return Type

`Result<(), Error>`

### `pass_progress_snapshot`
Return a progress snapshot for `pass_id`.  Unknown pass ids return `exists = false` with zeroed numeric fields. `completion_pct` is integer division (0–100), rounded down. `is_complete` is `true` only when `completed_missions == total_missions` and `total_missions > 0`.

```rust
pub fn pass_progress_snapshot(env: Env, pass_id: u32) -> PassProgressSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `pass_id` | `u32` |

#### Return Type

`PassProgressSnapshot`

### `unlock_gap`
Return the unlock gap for `pass_id`.  Unknown pass ids return `exists = false` with zeroed numeric fields. `missions_to_next_unlock` is floored at zero when the threshold is already reached.  `locked` is `false` when the threshold is met.

```rust
pub fn unlock_gap(env: Env, pass_id: u32) -> UnlockGap
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `pass_id` | `u32` |

#### Return Type

`UnlockGap`

