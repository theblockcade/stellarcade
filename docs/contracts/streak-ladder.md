# streak-ladder

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

### `upsert_bucket`
Create or update a streak bucket definition. Existing population counts are preserved so the summary accessor always reflects the latest assignment totals without reconstructing them from player scans.

```rust
pub fn upsert_bucket(env: Env, admin: Address, bucket_id: u32, min_streak: u32, max_streak: u32, demotion_window_secs: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `bucket_id` | `u32` |
| `min_streak` | `u32` |
| `max_streak` | `u32` |
| `demotion_window_secs` | `u64` |
| `paused` | `bool` |

### `assign_player`
Assign or refresh a player's streak inside a configured bucket.

```rust
pub fn assign_player(env: Env, admin: Address, user: Address, bucket_id: u32, current_streak: u32, last_extended_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `user` | `Address` |
| `bucket_id` | `u32` |
| `current_streak` | `u32` |
| `last_extended_at` | `u64` |

### `streak_bucket_summary`
Return a stable streak-bucket summary for `bucket_id`.  Before `init` this returns `configured = false` and `state = NotConfigured`. Unknown bucket ids after initialization return `exists = false`, `state = Missing`, and zeroed thresholds.

```rust
pub fn streak_bucket_summary(env: Env, bucket_id: u32) -> StreakBucketSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bucket_id` | `u32` |

#### Return Type

`StreakBucketSummary`

### `demotion_risk`
Return a compact demotion-risk view for a player.  Missing players return `player_found = false` and zeroed timing fields. Missing buckets return `bucket_found = false` without panicking. The risk window is computed from the current ledger timestamp; all timing values are exact seconds.

```rust
pub fn demotion_risk(env: Env, user: Address) -> DemotionRisk
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`DemotionRisk`

### `player_bucket_summary`
Return a joined player and bucket snapshot as a stable read model. Before `init` this returns `configured = false` and `state = NotConfigured`. Unknown players return `state = MissingPlayer` with zeroed bucket fields. Missing referenced buckets return `state = MissingBucket` while preserving player data. Paused buckets return `state = Paused`.

```rust
pub fn player_bucket_summary(env: Env, user: Address) -> PlayerBucketSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`PlayerBucketSummary`

