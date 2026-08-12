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

### `sweep_backlog_summary`
Backwards-compatible alias for the payout sweep backlog summary.

```rust
pub fn sweep_backlog_summary(env: Env) -> BatchProgressSummary
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

### `batch_health_snapshot`
Return a structured health snapshot for one payout batch.  Missing batch ids are not errors. They return `exists = false`, zeroed amounts, and either `Missing` or `NotConfigured` depending on whether the contract has been initialized. `progress_bps` is floored basis-point math and returns zero when `total_amount <= 0`.

```rust
pub fn batch_health_snapshot(env: Env, batch_id: u64) -> BatchHealthSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `batch_id` | `u64` |

#### Return Type

`BatchHealthSnapshot`

### `retry_gap`
Return the retry gap for a payout batch using ledger-based fallback math.  The current storage model does not persist a failure timestamp, so failed batches use `current_ledger + retry_gap_ledgers` as a conservative `retry_after_ledger` until a mutation path records richer retry history. Completed, healthy, missing, and not-configured states return gap zero and `can_retry = false`.

```rust
pub fn retry_gap(env: Env, batch_id: u64) -> RetryGap
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `batch_id` | `u64` |

#### Return Type

`RetryGap`

### `retry_window_accessor`
Backwards-compatible alias for the batch retry window accessor.

```rust
pub fn retry_window_accessor(env: Env, batch_id: u64) -> RetryGap
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `batch_id` | `u64` |

#### Return Type

`RetryGap`

### `distribution_rollup_summary`
Return an aggregated distribution rollup summary across all batches.  `completion_rate_bps` is floored basis-point math. Returns zero and `configured = false` when the contract has not been initialized.

```rust
pub fn distribution_rollup_summary(env: Env) -> DistributionRollupSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`DistributionRollupSummary`

### `delay_window`
Return the delay window for a specific batch.  Uses `DEFAULT_RETRY_GAP_LEDGERS` to project `delay_after_ledger` for failed batches. `within_delay = true` when the batch has failed and the delay window has not yet elapsed. Non-failed, completed, and missing batches return `within_delay = false` and zeroed timing fields.

```rust
pub fn delay_window(env: Env, batch_id: u64) -> DelayWindow
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `batch_id` | `u64` |

#### Return Type

`DelayWindow`

