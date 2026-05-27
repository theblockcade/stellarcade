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

