# perk-claims

## Public Methods

### `configure_perk`
Configures a perk with the queue threshold that must be reached before claims unlock. Panics if the perk already exists.

```rust
pub fn configure_perk(env: Env, id: u64, threshold: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `threshold` | `u32` |

### `queue_claim`
Adds the caller to the perk's claim queue. Idempotent per user.

```rust
pub fn queue_claim(env: Env, id: u64, user: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `user` | `Address` |

### `claim`
Claims the perk. Requires the threshold to be met, the caller to be queued, and not to have already claimed.

```rust
pub fn claim(env: Env, id: u64, user: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `user` | `Address` |

### `claim_queue_snapshot`
Claim queue snapshot; predictable zero-state when the perk is missing.

```rust
pub fn claim_queue_snapshot(env: Env, id: u64) -> ClaimQueueSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`ClaimQueueSnapshot`

### `threshold_gap`
Remaining gap to the claim threshold, plus progress in basis points.

```rust
pub fn threshold_gap(env: Env, id: u64) -> ThresholdGap
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`ThresholdGap`

### `cooldown_delay`
Returns the configured cooldown delay (defaults to 0 if not set).

```rust
pub fn cooldown_delay(env: Env) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`u64`

### `set_cooldown_delay`
Set the cooldown delay (in seconds).

```rust
pub fn set_cooldown_delay(env: Env, delay: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `delay` | `u64` |

### `claim_status_summary`
Detailed summary of a perk's claim status.

```rust
pub fn claim_status_summary(env: Env, id: u64) -> ClaimStatusSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`ClaimStatusSummary`

