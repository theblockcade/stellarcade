# queue-rewards

## Public Methods

### `init`
Initialize the reward contract.

```rust
pub fn init(env: Env, admin: Address, treasury: Address, token: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `treasury` | `Address` |
| `token` | `Address` |

#### Return Type

`Result<(), Error>`

### `set_pause`
Set the paused state of the contract. Admin only.

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

### `accrue_reward`
Accrue rewards for a user. Restricted to admin/authorized callers.

```rust
pub fn accrue_reward(env: Env, user: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `claim_reward`
Claim all pending rewards for the caller.

```rust
pub fn claim_reward(env: Env, user: Address) -> Result<i128, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`Result<i128, Error>`

### `get_reward_snapshot`
Returns a complete snapshot of the reward state for a user.  # Returns A `RewardSnapshot` containing: - `config`: Current contract configuration (None if uninitialized). - `user_state`: User's accrual and claim history (None if no activity). - `timestamp`: Ledger timestamp of the read.  # Zero-State Behavior Returns `None` for internal fields if the contract hasn't been initialized or the user has never interacted with the rewards system.

```rust
pub fn get_reward_snapshot(env: Env, user: Address) -> RewardSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`RewardSnapshot`

### `pending_balance`
Directly query user's pending balance.  # Fallback Returns 0 for unknown users or users with no pending rewards. Rounding: No rounding is performed as rewards are tracked in base units.

```rust
pub fn pending_balance(env: Env, user: Address) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`i128`

### `is_paused`
Returns whether the contract logic is currently halted.  # Default behavior Returns `true` (Halted) if the contract is not yet initialized to prevent unauthorized interactions.

```rust
pub fn is_paused(env: Env) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`bool`

