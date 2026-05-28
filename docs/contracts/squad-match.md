# squad-match

## Public Methods

### `init`
Initialize the squad match contract.

```rust
pub fn init(env: Env, admin: Address, min_players: u32, max_squads: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `min_players` | `u32` |
| `max_squads` | `u32` |

#### Return Type

`Result<(), Error>`

### `set_pause`
Set the paused state. Admin only.

```rust
pub fn set_pause(env: Env, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `create_match`
Create a new squad match.

```rust
pub fn create_match(env: Env, match_id: u32, creator: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `match_id` | `u32` |
| `creator` | `Address` |

#### Return Type

`Result<(), Error>`

### `get_match_snapshot`
Returns a complete snapshot of a specific match.  # Returns A `MatchSnapshot` containing config and state. Handles missing matches or uninitialized state explicitly.

```rust
pub fn get_match_snapshot(env: Env, match_id: u32) -> MatchSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `match_id` | `u32` |

#### Return Type

`MatchSnapshot`

### `get_match_status`
Returns the status of a specific match. Returns `Cancelled` as a fallback if the match does not exist.

```rust
pub fn get_match_status(env: Env, match_id: u32) -> MatchStatus
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `match_id` | `u32` |

#### Return Type

`MatchStatus`

### `is_paused`
Returns whether the matchmaking system is paused.

```rust
pub fn is_paused(env: Env) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`bool`

