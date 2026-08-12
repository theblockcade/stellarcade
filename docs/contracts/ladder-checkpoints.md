# ladder-checkpoints

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `upsert_checkpoint`
Create or update a checkpoint. Population counts are preserved across updates so the drift summary always reflects the latest recordings.

```rust
pub fn upsert_checkpoint(env: Env, admin: Address, checkpoint_id: u32, min_score: u32, restore_window_secs: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `checkpoint_id` | `u32` |
| `min_score` | `u32` |
| `restore_window_secs` | `u64` |
| `paused` | `bool` |

### `record_score`
Record / refresh a player's score against a checkpoint.  Per-checkpoint active/drifted counters are kept consistent across: new players, score improvements that clear a drift, and drops that trigger a drift. Players that move between checkpoints are removed from the previous one before being added to the new.

```rust
pub fn record_score(env: Env, admin: Address, user: Address, checkpoint_id: u32, score: u32, last_seen_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `user` | `Address` |
| `checkpoint_id` | `u32` |
| `score` | `u32` |
| `last_seen_at` | `u64` |

### `checkpoint_drift_summary`
Return a stable drift summary for `checkpoint_id`.  Pre-`init` returns `configured = false` / `state = NotConfigured`. Unknown ids after init return `exists = false` / `state = Missing` with zeroed thresholds.

```rust
pub fn checkpoint_drift_summary(env: Env, checkpoint_id: u32) -> CheckpointDriftSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `checkpoint_id` | `u32` |

#### Return Type

`CheckpointDriftSummary`

### `restore_window_accessor`
Per-player restore-window accessor.  Missing players → `NoRecord` + zeroed timing. Missing checkpoints → `MissingCheckpoint`. A paused checkpoint surfaces as `Blocked` so frontends suppress restore prompts. Otherwise the state distinguishes players who are still in good standing (`NotDrifted`) from players who have drifted but can still restore (`Open`) from those whose window has lapsed (`Closed`).

```rust
pub fn restore_window_accessor(env: Env, user: Address) -> RestoreWindowInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`RestoreWindowInfo`

