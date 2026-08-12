# player-rating

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

### `volatility_summary`
Returns a summary of rating volatility metrics.

```rust
pub fn volatility_summary(env: Env, player: Address) -> VolatilitySummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |

#### Return Type

`VolatilitySummary`

### `recent_adjustment_snapshot`
Returns a snapshot of recent rating adjustments.

```rust
pub fn recent_adjustment_snapshot(env: Env, player: Address) -> RecentAdjustmentSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |

#### Return Type

`RecentAdjustmentSnapshot`

### `update_cooldown`
Returns the configured update cooldown (defaults to 0).

```rust
pub fn update_cooldown(env: Env) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`u64`

### `set_update_cooldown`
Sets the update cooldown. Admin only.

```rust
pub fn set_update_cooldown(env: Env, admin: Address, cooldown: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `cooldown` | `u64` |

#### Return Type

`Result<(), Error>`

### `rating_distribution_snapshot`
Returns the current rating distribution snapshot.

```rust
pub fn rating_distribution_snapshot(env: Env) -> RatingDistributionSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RatingDistributionSnapshot`

### `set_rating_distribution`
Sets the rating distribution snapshot. Admin only.

```rust
pub fn set_rating_distribution(env: Env, admin: Address, snapshot: RatingDistributionSnapshot) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `snapshot` | `RatingDistributionSnapshot` |

#### Return Type

`Result<(), Error>`

