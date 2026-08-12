# rank-rewards

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

### `upsert_bracket`
Create or update a bracket. When the bracket already exists, the `player_count` and `total_reward_owed` aggregates are preserved. Changing `reward_per_player` *does not* retroactively re-cost existing assignments — the aggregate moves only when players are added or removed.

```rust
pub fn upsert_bracket(env: Env, admin: Address, bracket_id: u32, min_rank: u32, max_rank: u32, reward_per_player: u128, rollover_cooldown_secs: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `bracket_id` | `u32` |
| `min_rank` | `u32` |
| `max_rank` | `u32` |
| `reward_per_player` | `u128` |
| `rollover_cooldown_secs` | `u64` |
| `paused` | `bool` |

### `set_player_rank`
Assign / refresh a player's rank inside a bracket. Inter-bracket migration adjusts both brackets' aggregates atomically.

```rust
pub fn set_player_rank(env: Env, admin: Address, user: Address, bracket_id: u32, rank: u32, last_rollover_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `user` | `Address` |
| `bracket_id` | `u32` |
| `rank` | `u32` |
| `last_rollover_at` | `u64` |

### `bracket_reward_summary`
Bracket-level summary for the rewards panel.

```rust
pub fn bracket_reward_summary(env: Env, bracket_id: u32) -> BracketRewardSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bracket_id` | `u32` |

#### Return Type

`BracketRewardSummary`

### `rollover_readiness_accessor`
Per-player rollover readiness. Missing player → `NoRecord`; missing bracket → `MissingBracket`; cooldown not yet elapsed → `NotReady`; elapsed but paused → `BlockedByPause`; otherwise `Ready`.

```rust
pub fn rollover_readiness_accessor(env: Env, user: Address) -> RolloverReadinessInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`RolloverReadinessInfo`

