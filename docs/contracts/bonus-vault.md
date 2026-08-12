# bonus-vault

## Public Methods

### `initialize`
```rust
pub fn initialize(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `set_paused`
```rust
pub fn set_paused(env: Env, admin: Address, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `paused` | `bool` |

### `set_state`
```rust
pub fn set_state(env: Env, admin: Address, pending_accrual: i128, release_threshold: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `pending_accrual` | `i128` |
| `release_threshold` | `i128` |

### `get_accrual_pressure_summary`
```rust
pub fn get_accrual_pressure_summary(env: Env) -> AccrualPressureSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`AccrualPressureSummary`

### `get_release_threshold_accessor`
```rust
pub fn get_release_threshold_accessor(env: Env) -> ReleaseThresholdAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ReleaseThresholdAccessor`

### `release_threshold_accessor`
Backwards-compatible accessor for the release-threshold read model.

```rust
pub fn release_threshold_accessor(env: Env) -> ReleaseThresholdAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ReleaseThresholdAccessor`

### `vault_allocation_summary`
```rust
pub fn vault_allocation_summary(env: Env) -> VaultAllocationSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`VaultAllocationSummary`

### `unlock_window_accessor`
```rust
pub fn unlock_window_accessor(env: Env, unlock_threshold: i128) -> UnlockWindowAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `unlock_threshold` | `i128` |

#### Return Type

`UnlockWindowAccessor`

### `pending_outflow_summary`
Return the pending outflow pressure summary.  Zero-state returns `Unconfigured` with zeroed numeric fields.

```rust
pub fn pending_outflow_summary(env: Env) -> PendingOutflowSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`PendingOutflowSummary`

