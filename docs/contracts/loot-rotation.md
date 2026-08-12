# loot-rotation

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

### `set_paused`
```rust
pub fn set_paused(env: Env, admin: Address, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `paused` | `bool` |

### `set_active_pool`
```rust
pub fn set_active_pool(env: Env, admin: Address, pool_id: u64, item_count: u32, reward_weight: u32, starts_at: u64, ends_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `pool_id` | `u64` |
| `item_count` | `u32` |
| `reward_weight` | `u32` |
| `starts_at` | `u64` |
| `ends_at` | `u64` |

### `active_pool_snapshot`
Returns a stable active-pool read model for client rotation screens.  Empty state returns `has_active_pool = false` with zeroed pool values. `seconds_until_rollover` uses saturating subtraction and is zero once the pool has reached or passed `ends_at`.

```rust
pub fn active_pool_snapshot(env: Env) -> ActivePoolSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ActivePoolSnapshot`

### `rotation_queue_summary`
Returns a rotation queue summary combining pool state and rollover timing.  Zero-state: `has_active_pool = false` and zeroed numeric fields when no pool has been configured. `rollover_due = true` once `ends_at` is reached.

```rust
pub fn rotation_queue_summary(env: Env) -> RotationQueueSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RotationQueueSummary`

### `transition_gap`
Returns transition timing for the active pool in a compact shape.  `transition_due = true` once `ends_at` is reached or passed. Missing pools return `has_active_pool = false` and zeroed timing fields.

```rust
pub fn transition_gap(env: Env) -> TransitionGap
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`TransitionGap`

### `rollover_delay`
Returns rollover timing in a compact shape for operators.  Missing pools return `rollover_due = false` and a zero delay.

```rust
pub fn rollover_delay(env: Env) -> RolloverDelay
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RolloverDelay`

