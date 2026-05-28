# tournament-lobby

## Public Methods

### `init`
Initialize the contract with an admin.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `ready_check_summary`
Return the ready-check summary for a specific lobby.

```rust
pub fn ready_check_summary(env: Env, lobby_id: u64) -> ReadyCheckSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `lobby_id` | `u64` |

#### Return Type

`ReadyCheckSummary`

### `seat_availability`
Return the seat availability for a specific lobby.

```rust
pub fn seat_availability(env: Env, lobby_id: u64) -> SeatAvailability
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `lobby_id` | `u64` |

#### Return Type

`SeatAvailability`

### `create_lobby`
Create a new lobby. Admin only.

```rust
pub fn create_lobby(env: Env, admin: Address, lobby_id: u64, max_seats: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `lobby_id` | `u64` |
| `max_seats` | `u32` |

### `join_lobby`
Join a lobby. Player must auth.

```rust
pub fn join_lobby(env: Env, lobby_id: u64, player: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `lobby_id` | `u64` |
| `player` | `Address` |

### `set_ready`
Set readiness state for a player in a lobby. Player must auth.

```rust
pub fn set_ready(env: Env, lobby_id: u64, player: Address, ready: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `lobby_id` | `u64` |
| `player` | `Address` |
| `ready` | `bool` |

