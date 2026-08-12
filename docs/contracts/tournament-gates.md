# tournament-gates

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

### `set_gate`
```rust
pub fn set_gate(env: Env, admin: Address, gate_id: u32, capacity: u32, entry_fee: i128, opens_at: u64, closes_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `gate_id` | `u32` |
| `capacity` | `u32` |
| `entry_fee` | `i128` |
| `opens_at` | `u64` |
| `closes_at` | `u64` |

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

### `gate_health_snapshot`
```rust
pub fn gate_health_snapshot(env: Env, gate_id: u32) -> GateHealthSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `gate_id` | `u32` |

#### Return Type

`GateHealthSnapshot`

### `unlock_delay_accessor`
```rust
pub fn unlock_delay_accessor(env: Env, gate_id: u32, now: u64) -> UnlockDelayAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `gate_id` | `u32` |
| `now` | `u64` |

#### Return Type

`UnlockDelayAccessor`

