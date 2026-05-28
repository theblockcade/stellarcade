# fanout-distributor

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: soroban_sdk::Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

### `create_batch`
```rust
pub fn create_batch(env: Env, admin: soroban_sdk::Address, batch_id: u64, total_amount: i128, recipient_count: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `batch_id` | `u64` |
| `total_amount` | `i128` |
| `recipient_count` | `u32` |

### `distribute`
```rust
pub fn distribute(env: Env, admin: soroban_sdk::Address, batch_id: u64, amount: i128) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `batch_id` | `u64` |
| `amount` | `i128` |

#### Return Type

`i128`

### `complete_batch`
```rust
pub fn complete_batch(env: Env, admin: soroban_sdk::Address, batch_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `batch_id` | `u64` |

### `mark_failed`
```rust
pub fn mark_failed(env: Env, admin: soroban_sdk::Address, batch_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `batch_id` | `u64` |

### `batch_progress_summary`
```rust
pub fn batch_progress_summary(env: Env) -> BatchProgressSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`BatchProgressSummary`

### `retryable_failure`
```rust
pub fn retryable_failure(env: Env, batch_id: u64) -> RetryableFailure
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `batch_id` | `u64` |

#### Return Type

`RetryableFailure`

