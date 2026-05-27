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

