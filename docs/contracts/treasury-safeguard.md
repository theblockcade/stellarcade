# treasury-safeguard

## Public Methods

### `init`
Initializes the safeguard with admin, threshold limit, and cooldown period.

```rust
pub fn init(env: Env, admin: Address, threshold_limit: i128, cooldown_period: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `threshold_limit` | `i128` |
| `cooldown_period` | `u64` |

### `set_paused`
Toggles the paused state of the safeguard. Admin only.

```rust
pub fn set_paused(env: Env, admin: Address, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `paused` | `bool` |

### `get_threshold_breach_summary`
Returns a structured summary of the current threshold breach state. Handles unconfigured states by returning default values.

```rust
pub fn get_threshold_breach_summary(env: Env) -> ThresholdBreachSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ThresholdBreachSummary`

### `get_cooldown_release`
Returns the current cooldown status. Handles empty/missing states by returning is_in_cooldown = false.

```rust
pub fn get_cooldown_release(env: Env) -> CooldownRelease
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`CooldownRelease`

### `record_activity`
Administrative method to record activity and check for breaches.

```rust
pub fn record_activity(env: Env, admin: Address, value: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `value` | `i128` |

### `reset_safeguard`
Resets the breach state and clears cooldown.

```rust
pub fn reset_safeguard(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

