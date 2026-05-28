# guild-season

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

### `set_active_season`
```rust
pub fn set_active_season(env: Env, admin: Address, season_id: u64, reward_threshold: u64, starts_at: u64, ends_at: u64, guild_count: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `season_id` | `u64` |
| `reward_threshold` | `u64` |
| `starts_at` | `u64` |
| `ends_at` | `u64` |
| `guild_count` | `u32` |

### `active_season_snapshot`
```rust
pub fn active_season_snapshot(env: Env) -> ActiveSeasonSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ActiveSeasonSnapshot`

### `reward_threshold`
```rust
pub fn reward_threshold(env: Env, season_id: u64) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `season_id` | `u64` |

#### Return Type

`u64`

