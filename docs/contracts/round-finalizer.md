# round-finalizer

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

### `upsert_round`
```rust
pub fn upsert_round(env: Env, admin: Address, round_id: u64, unresolved_ops: u32, has_checkpoint: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `round_id` | `u64` |
| `unresolved_ops` | `u32` |
| `has_checkpoint` | `bool` |

### `get_unresolved_round_summary`
```rust
pub fn get_unresolved_round_summary(env: Env) -> UnresolvedRoundSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`UnresolvedRoundSummary`

### `get_finalize_readiness`
```rust
pub fn get_finalize_readiness(env: Env, round_id: u64) -> FinalizeReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `round_id` | `u64` |

#### Return Type

`FinalizeReadiness`

