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

### `get_safeguard_limits_summary`
Return a summary of configured safeguard limits and current utilization.  `utilization_bps = floor(current_value.min(threshold_limit) * 10_000 / threshold_limit)` when `threshold_limit > 0 && current_value > 0`, otherwise 0. Missing or unconfigured states return `is_configured = false` with all zeros.

```rust
pub fn get_safeguard_limits_summary(env: Env) -> SafeguardLimitsSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`SafeguardLimitsSummary`

### `get_override_window_accessor`
Return an override-window view for the safeguard.  `override_available` is true when the safeguard is configured, not in cooldown, and not paused — meaning an authorized caller may act without waiting for a cooldown to expire.

```rust
pub fn get_override_window_accessor(env: Env) -> OverrideWindowAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`OverrideWindowAccessor`

