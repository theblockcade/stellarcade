# reward-stream

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

### `configure_stream`
```rust
pub fn configure_stream(env: Env, admin: Address, stream_id: u64, total_allocated: i128, total_withdrawn: i128, unlock_time: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `stream_id` | `u64` |
| `total_allocated` | `i128` |
| `total_withdrawn` | `i128` |
| `unlock_time` | `u64` |
| `paused` | `bool` |

### `stream_health_summary`
```rust
pub fn stream_health_summary(env: Env) -> StreamHealthSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`StreamHealthSummary`

### `withdrawal_readiness`
```rust
pub fn withdrawal_readiness(env: Env, now: u64) -> WithdrawalReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `now` | `u64` |

#### Return Type

`WithdrawalReadiness`

