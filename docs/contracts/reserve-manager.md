# reserve-manager

## Public Methods

### `init`
Initialize the reserve manager.

```rust
pub fn init(env: Env, admin: Address, treasury: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `treasury` | `Address` |

#### Return Type

`Result<(), Error>`

### `set_pause`
Set the paused state. Admin only.

```rust
pub fn set_pause(env: Env, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `update_reserve`
Update an asset's reserve targets and current balance. Admin only.

```rust
pub fn update_reserve(env: Env, asset: Address, balance: i128, target: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `asset` | `Address` |
| `balance` | `i128` |
| `target` | `i128` |

#### Return Type

`Result<(), Error>`

### `get_full_snapshot`
Returns a complete snapshot of all managed reserves.  # Returns A `ReserveSnapshot` containing current configuration and states for all tracked assets. Handles uninitialized state by returning `None` for config and an empty list of reserves.

```rust
pub fn get_full_snapshot(env: Env) -> ReserveSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ReserveSnapshot`

### `get_reserve_for`
Returns the reserve state for a specific asset. Returns `None` if the asset is not managed.

```rust
pub fn get_reserve_for(env: Env, asset: Address) -> Option<ReserveState>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `asset` | `Address` |

#### Return Type

`Option<ReserveState>`

### `is_paused`
Returns whether the manager is paused.

```rust
pub fn is_paused(env: Env) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`bool`

### `sweep_cooldown_ledgers`
Return the sweep cooldown in ledgers.  The sweep cooldown is the minimum gap between successive treasury sweeps. It is a fixed contract constant so consumers share a single source of truth.

```rust
pub fn sweep_cooldown_ledgers(_env: Env) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `_env` | `Env` |

#### Return Type

`u32`

### `manager_threshold_summary`
Return a threshold health summary across all managed reserves.  Counts healthy, below-target, and critical reserves, and the number that meet or exceed their target balance. Returns zero counts when uninitialized.

```rust
pub fn manager_threshold_summary(env: Env) -> ManagerThresholdSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ManagerThresholdSummary`

