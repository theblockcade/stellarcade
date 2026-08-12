# map-rotation

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

### `active_map_cycle_snapshot`
Returns a snapshot of the current active map cycle.

```rust
pub fn active_map_cycle_snapshot(env: Env) -> ActiveMapCycleSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ActiveMapCycleSnapshot`

### `next_rotation`
Returns details about the next map rotation.

```rust
pub fn next_rotation(env: Env) -> NextRotation
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`NextRotation`

### `vote_window`
Returns the configured voting window (defaults to 0 if not set).

```rust
pub fn vote_window(env: Env) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`u64`

### `set_vote_window`
Set the voting window (in seconds). Admin only.

```rust
pub fn set_vote_window(env: Env, window: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `window` | `u64` |

#### Return Type

`Result<(), Error>`

### `map_popularity_snapshot`
Returns popularity stats for a map.

```rust
pub fn map_popularity_snapshot(env: Env, map: Symbol) -> MapPopularitySnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `map` | `Symbol` |

#### Return Type

`MapPopularitySnapshot`

### `record_vote`
Increments votes for a map.

```rust
pub fn record_vote(env: Env, map: Symbol)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `map` | `Symbol` |

### `record_play`
Increments play counts for a map.

```rust
pub fn record_play(env: Env, map: Symbol)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `map` | `Symbol` |

### `update_rating`
Updates the rating of a map.

```rust
pub fn update_rating(env: Env, map: Symbol, rating_bps: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `map` | `Symbol` |
| `rating_bps` | `u32` |

