# wallet-claims-v2

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `set_cooldown_policy`
```rust
pub fn set_cooldown_policy(env: Env, admin: Address, wallet: Address, cooldown_seconds: u64, threshold_amount: i128, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `wallet` | `Address` |
| `cooldown_seconds` | `u64` |
| `threshold_amount` | `i128` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `queue_claim`
```rust
pub fn queue_claim(env: Env, admin: Address, claim_id: u64, wallet: Address, amount: i128, available_after: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `claim_id` | `u64` |
| `wallet` | `Address` |
| `amount` | `i128` |
| `available_after` | `u64` |

#### Return Type

`Result<(), Error>`

### `settle_claim`
```rust
pub fn settle_claim(env: Env, admin: Address, claim_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `claim_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `claim_pressure_snapshot`
```rust
pub fn claim_pressure_snapshot(env: Env, wallet: Address) -> ClaimPressureSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `wallet` | `Address` |

#### Return Type

`ClaimPressureSnapshot`

### `cooldown_threshold_accessor`
```rust
pub fn cooldown_threshold_accessor(env: Env, wallet: Address) -> CooldownThresholdAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `wallet` | `Address` |

#### Return Type

`CooldownThresholdAccessor`

