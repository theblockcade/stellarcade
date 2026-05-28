# reward-unlocker

## Public Methods

### `init`
Initialize the contract with a super admin. Can only be called once.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `get_admin`
Get the current admin.

```rust
pub fn get_admin(env: Env) -> Address
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Address`

### `queue_reward`
Queue a reward for unlock after a cooldown period.

```rust
pub fn queue_reward(env: Env, recipient: Address, amount: i128, cooldown_ledgers: u32) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `recipient` | `Address` |
| `amount` | `i128` |
| `cooldown_ledgers` | `u32` |

#### Return Type

`u32`

### `claim_queued_reward`
Claim a reward that has finished its cooldown.

```rust
pub fn claim_queued_reward(env: Env, recipient: Address, queue_id: u32) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `recipient` | `Address` |
| `queue_id` | `u32` |

#### Return Type

`i128`

### `get_unlock_queue_summary`
Get a summary of all queued rewards for a recipient. Returns graceful empty state if no rewards queued.

```rust
pub fn get_unlock_queue_summary(env: Env, recipient: Address) -> UnlockQueueSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `recipient` | `Address` |

#### Return Type

`UnlockQueueSummary`

### `get_cooldown_gap`
Get cooldown gap info for a specific queue entry. Handles missing entry by treating as ready to claim.

```rust
pub fn get_cooldown_gap(env: Env, recipient: Address, queue_id: u32) -> CooldownGapInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `recipient` | `Address` |
| `queue_id` | `u32` |

#### Return Type

`CooldownGapInfo`

### `list_queued_rewards`
List all queue IDs for a recipient (paginated).

```rust
pub fn list_queued_rewards(env: Env, recipient: Address, start: u32, limit: u32) -> Vec<u32>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `recipient` | `Address` |
| `start` | `u32` |
| `limit` | `u32` |

#### Return Type

`Vec<u32>`

