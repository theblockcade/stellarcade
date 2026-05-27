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

