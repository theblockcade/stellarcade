# vote-escrow

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

### `lock`
```rust
pub fn lock(env: Env, locker: Address, lock_id: u64, amount: i128, unlock_time: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `locker` | `Address` |
| `lock_id` | `u64` |
| `amount` | `i128` |
| `unlock_time` | `u64` |

### `unlock`
```rust
pub fn unlock(env: Env, admin: Address, lock_id: u64) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `lock_id` | `u64` |

#### Return Type

`i128`

### `lock_duration_breakdown`
```rust
pub fn lock_duration_breakdown(env: Env) -> LockDurationBreakdown
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`LockDurationBreakdown`

### `unlock_pressure`
```rust
pub fn unlock_pressure(env: Env, lock_id: u64) -> UnlockPressure
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `lock_id` | `u64` |

#### Return Type

`UnlockPressure`

