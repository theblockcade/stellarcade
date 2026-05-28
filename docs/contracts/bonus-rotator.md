# bonus-rotator

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

### `set_active_cycle`
```rust
pub fn set_active_cycle(env: Env, admin: Address, cycle_id: u64, bonus_bps: u32, starts_at: u64, ends_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `cycle_id` | `u64` |
| `bonus_bps` | `u32` |
| `starts_at` | `u64` |
| `ends_at` | `u64` |

### `active_bonus_cycle_snapshot`
```rust
pub fn active_bonus_cycle_snapshot(env: Env) -> ActiveBonusCycleSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ActiveBonusCycleSnapshot`

### `next_rollover_at`
```rust
pub fn next_rollover_at(env: Env) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`u64`

