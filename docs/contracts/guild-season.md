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

### `season_performance_summary`
Return a performance summary for the active season including whether the season is currently active (within its time window) and how many seconds remain until it ends.

```rust
pub fn season_performance_summary(env: Env) -> SeasonPerformanceSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`SeasonPerformanceSummary`

### `tier_cutoff_accessor`
Return the tier cutoff in basis points: reward_threshold * 10_000 / guild_count. Returns 0 when there is no active season or guild_count is 0.

```rust
pub fn tier_cutoff_accessor(env: Env) -> TierCutoffAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`TierCutoffAccessor`

