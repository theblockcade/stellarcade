# arena-sessions

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
pub fn set_paused(env: Env, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `start_session`
```rust
pub fn start_session(env: Env, player: Address, arena_id: u32, stake_amount: i128, duration_ledgers: u32) -> Result<u64, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `arena_id` | `u32` |
| `stake_amount` | `i128` |
| `duration_ledgers` | `u32` |

#### Return Type

`Result<u64, Error>`

### `complete_session`
```rust
pub fn complete_session(env: Env, player: Address, session_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `session_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `expire_session`
```rust
pub fn expire_session(env: Env, session_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `session_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `session_status`
```rust
pub fn session_status(env: Env, session_id: u64) -> ArenaSessionView
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `session_id` | `u64` |

#### Return Type

`ArenaSessionView`

### `player_summary`
```rust
pub fn player_summary(env: Env, player: Address) -> PlayerArenaSessionSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |

#### Return Type

`PlayerArenaSessionSummary`

### `active_session_summary`
Returns a compact summary of the player's current active session, or a zero-state if none.

```rust
pub fn active_session_summary(env: Env, player: Address) -> ActiveSessionSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |

#### Return Type

`ActiveSessionSummary`

### `expiration_delay`
Returns the expiration delay for a session: how many ledgers remain until it expires, zero if already expired or not active.

```rust
pub fn expiration_delay(env: Env, session_id: u64) -> ExpirationDelay
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `session_id` | `u64` |

#### Return Type

`ExpirationDelay`

