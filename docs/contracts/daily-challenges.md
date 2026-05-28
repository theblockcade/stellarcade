# daily-challenges

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

### `set_paused`
```rust
pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `set_refresh_interval`
Configure the refresh interval (in ledgers).

```rust
pub fn set_refresh_interval(env: Env, admin: Address, interval_ledgers: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `interval_ledgers` | `u32` |

#### Return Type

`Result<(), Error>`

### `record_refresh`
Record that a refresh has just occurred.

```rust
pub fn record_refresh(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `add_challenge`
Register a new daily challenge.

```rust
pub fn add_challenge(env: Env, admin: Address, id: Symbol, description: Symbol, expires_at: u32, reward: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `id` | `Symbol` |
| `description` | `Symbol` |
| `expires_at` | `u32` |
| `reward` | `i128` |

#### Return Type

`Result<(), Error>`

### `complete_challenge`
Mark a challenge as completed by a player.

```rust
pub fn complete_challenge(env: Env, player: Address, challenge_id: Symbol) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `challenge_id` | `Symbol` |

#### Return Type

`Result<(), Error>`

### `claim_reward`
Claim the reward for a completed challenge.

```rust
pub fn claim_reward(env: Env, player: Address, challenge_id: Symbol) -> Result<i128, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `challenge_id` | `Symbol` |

#### Return Type

`Result<i128, Error>`

### `completion_snapshot`
Return a completion snapshot for a (challenge, player) pair.  Zero-state: `exists` false when no record exists.

```rust
pub fn completion_snapshot(env: Env, challenge_id: Symbol, player: Address) -> CompletionSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `challenge_id` | `Symbol` |
| `player` | `Address` |

#### Return Type

`CompletionSnapshot`

### `refresh_window`
Return refresh window information.  Zero-state: `configured` false when no interval has been set.

```rust
pub fn refresh_window(env: Env) -> RefreshWindowInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RefreshWindowInfo`

### `get_challenge_ids`
Return a list of all challenge ids.

```rust
pub fn get_challenge_ids(env: Env) -> Vec<Symbol>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Vec<Symbol>`

