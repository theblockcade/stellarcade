# sponsor-lockbox

## Public Methods

### `init`
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

### `register_lock`
```rust
pub fn register_lock(env: Env, admin: Address, lock_id: u64, sponsor: Address, beneficiary: Address, amount: i128, unlock_at: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `lock_id` | `u64` |
| `sponsor` | `Address` |
| `beneficiary` | `Address` |
| `amount` | `i128` |
| `unlock_at` | `u64` |

#### Return Type

`Result<(), Error>`

### `release`
```rust
pub fn release(env: Env, beneficiary: Address, lock_id: u64) -> Result<i128, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `beneficiary` | `Address` |
| `lock_id` | `u64` |

#### Return Type

`Result<i128, Error>`

### `cancel`
```rust
pub fn cancel(env: Env, admin: Address, lock_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `lock_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `liability_snapshot`
```rust
pub fn liability_snapshot(env: Env) -> LiabilitySnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`LiabilitySnapshot`

### `unlock_queue_accessor`
```rust
pub fn unlock_queue_accessor(env: Env) -> UnlockQueueAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`UnlockQueueAccessor`

