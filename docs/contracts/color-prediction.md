# color-prediction

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address, rng_contract: Address, prize_pool_contract: Address, balance_contract: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `rng_contract` | `Address` |
| `prize_pool_contract` | `Address` |
| `balance_contract` | `Address` |

#### Return Type

`Result<(), Error>`

### `place_prediction`
```rust
pub fn place_prediction(env: Env, player: Address, color: u32, wager: i128, game_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `color` | `u32` |
| `wager` | `i128` |
| `game_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `resolve_prediction`
```rust
pub fn resolve_prediction(env: Env, game_id: u64, winning_color: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `u64` |
| `winning_color` | `u32` |

#### Return Type

`Result<(), Error>`

### `get_game`
```rust
pub fn get_game(env: Env, game_id: u64) -> Option<GameData>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `u64` |

#### Return Type

`Option<GameData>`

### `get_prediction`
```rust
pub fn get_prediction(env: Env, game_id: u64, player: Address) -> PredictionView
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `u64` |
| `player` | `Address` |

#### Return Type

`PredictionView`

### `get_players`
```rust
pub fn get_players(env: Env, game_id: u64) -> Vec<Address>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `u64` |

#### Return Type

`Vec<Address>`

### `is_initialized`
```rust
pub fn is_initialized(env: Env) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`bool`

### `get_config`
```rust
pub fn get_config(env: Env) -> ConfigView
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ConfigView`

### `player_has_predicted`
```rust
pub fn player_has_predicted(env: Env, game_id: u64, player: Address) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `u64` |
| `player` | `Address` |

#### Return Type

`bool`

### `game_summary`
```rust
pub fn game_summary(env: Env, game_id: u64) -> GameSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `u64` |

#### Return Type

`GameSummary`

