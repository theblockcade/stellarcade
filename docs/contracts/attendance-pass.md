# attendance-pass

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `issue_pass`
```rust
pub fn issue_pass(env: Env, admin: Address, pass_id: u64, holder: Address, expires_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `pass_id` | `u64` |
| `holder` | `Address` |
| `expires_at` | `u64` |

### `expire_pass`
```rust
pub fn expire_pass(env: Env, admin: Address, pass_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `pass_id` | `u64` |

### `holder_coverage_summary`
```rust
pub fn holder_coverage_summary(env: Env) -> HolderCoverageSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`HolderCoverageSummary`

### `expiry_band`
```rust
pub fn expiry_band(env: Env, pass_id: u64) -> ExpiryBand
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `pass_id` | `u64` |

#### Return Type

`ExpiryBand`

### `redemption_readiness_snapshot`
Returns a readiness snapshot for redeeming a pass.  Empty/missing behavior: - Unknown `pass_id` returns `exists = false` and zero-value fields. - Not-yet-configured contracts return `configured = false` and `status = NotConfigured`.

```rust
pub fn redemption_readiness_snapshot(env: Env, pass_id: u64) -> RedemptionReadinessSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `pass_id` | `u64` |

#### Return Type

`RedemptionReadinessSnapshot`

### `mark_checked_in`
```rust
pub fn mark_checked_in(env: Env, admin: Address, pass_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `pass_id` | `u64` |

### `check_in_coverage_summary`
```rust
pub fn check_in_coverage_summary(env: Env) -> CheckInCoverageSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`CheckInCoverageSummary`

### `pass_validity_snapshot`
Returns a validity snapshot for a pass.  `time_remaining` uses saturating subtraction — zero when expired or missing. Unknown pass ids and unconfigured contracts return predictable zero-state values.

```rust
pub fn pass_validity_snapshot(env: Env, pass_id: u64) -> PassValiditySnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `pass_id` | `u64` |

#### Return Type

`PassValiditySnapshot`

### `grace_period_accessor`
Returns the grace-period window for a pass.  The contract does not store a per-pass grace configuration; callers supply `grace_seconds` and this function computes whether the pass is currently inside the grace window. When `grace_seconds` is zero the grace period is disabled and `in_grace_period` is always false.

```rust
pub fn grace_period_accessor(env: Env, pass_id: u64, grace_seconds: u64) -> GracePeriodAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `pass_id` | `u64` |
| `grace_seconds` | `u64` |

#### Return Type

`GracePeriodAccessor`

### `set_resale_lock`
```rust
pub fn set_resale_lock(env: Env, admin: Address, pass_id: u64, locked: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `pass_id` | `u64` |
| `locked` | `bool` |

### `resale_lock_status`
```rust
pub fn resale_lock_status(env: Env, pass_id: u64) -> ResaleLockStatus
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `pass_id` | `u64` |

#### Return Type

`ResaleLockStatus`

