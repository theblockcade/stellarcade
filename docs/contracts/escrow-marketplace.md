# escrow-marketplace

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

### `create_escrow`
```rust
pub fn create_escrow(env: Env, buyer: Address, seller: Address, amount: i128, expiry: u64) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `buyer` | `Address` |
| `seller` | `Address` |
| `amount` | `i128` |
| `expiry` | `u64` |

#### Return Type

`u64`

### `raise_dispute`
```rust
pub fn raise_dispute(env: Env, caller: Address, escrow_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `caller` | `Address` |
| `escrow_id` | `u64` |

### `release_escrow`
```rust
pub fn release_escrow(env: Env, caller: Address, escrow_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `caller` | `Address` |
| `escrow_id` | `u64` |

### `expire_escrow`
```rust
pub fn expire_escrow(env: Env, escrow_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `escrow_id` | `u64` |

### `escrow_status_snapshot`
```rust
pub fn escrow_status_snapshot(env: Env, escrow_id: u64) -> EscrowStatusSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `escrow_id` | `u64` |

#### Return Type

`EscrowStatusSnapshot`

### `release_readiness`
```rust
pub fn release_readiness(env: Env, escrow_id: u64) -> ReleaseReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `escrow_id` | `u64` |

#### Return Type

`ReleaseReadiness`

