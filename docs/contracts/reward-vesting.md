# reward-vesting

## Public Methods

### `init`
Initialise the vesting contract. Must be called once.

```rust
pub fn init(env: Env, admin: Address, token_address: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `token_address` | `Address` |

### `create_vesting_schedule`
Create a new vesting schedule for `user`.  * `amount`             – tokens to vest (> 0) * `start_timestamp`    – when vesting begins (UNIX seconds) * `cliff_seconds`      – seconds from start before any claim * `duration_seconds`   – total linear-vesting window (> 0)

```rust
pub fn create_vesting_schedule(env: Env, user: Address, amount: i128, start_timestamp: u64, cliff_seconds: u64, duration_seconds: u64) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `amount` | `i128` |
| `start_timestamp` | `u64` |
| `cliff_seconds` | `u64` |
| `duration_seconds` | `u64` |

#### Return Type

`u64`

### `claim_vested`
Claim all currently vested tokens for `user`. Returns amount transferred.

```rust
pub fn claim_vested(env: Env, user: Address) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`i128`

### `revoke_schedule`
Revoke a vesting schedule. Unvested tokens are returned to the admin.

```rust
pub fn revoke_schedule(env: Env, schedule_id: u64) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `schedule_id` | `u64` |

#### Return Type

`i128`

### `vesting_state`
Return all vesting schedules for `user`.

```rust
pub fn vesting_state(env: Env, user: Address) -> Vec<VestingSchedule>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`Vec<VestingSchedule>`

### `get_vesting_summary`
Return a vesting summary for `user` with allocation, claimed, claimable, and remaining amounts. Returns empty summary with zero values if user has no vesting schedules.

```rust
pub fn get_vesting_summary(env: Env, user: Address) -> VestingSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`VestingSummary`

