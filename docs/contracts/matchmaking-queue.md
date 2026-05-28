# matchmaking-queue

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

### `enqueue_player`
Enqueue a player into a matchmaking queue. Player must auth.

```rust
pub fn enqueue_player(env: Env, queue_id: Symbol, player: Address, criteria_hash: Symbol)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `queue_id` | `Symbol` |
| `player` | `Address` |
| `criteria_hash` | `Symbol` |

### `dequeue_player`
Remove a player from a queue. Only admin or the player themselves can dequeue.

```rust
pub fn dequeue_player(env: Env, caller: Address, queue_id: Symbol, player: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `caller` | `Address` |
| `queue_id` | `Symbol` |
| `player` | `Address` |

### `create_match`
Create a match from a set of players. Admin-only. Players are removed from the queue on match creation.

```rust
pub fn create_match(env: Env, queue_id: Symbol, players: Vec<Address>) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `queue_id` | `Symbol` |
| `players` | `Vec<Address>` |

#### Return Type

`u64`

### `queue_state`
Read the current state of a queue.

```rust
pub fn queue_state(env: Env, queue_id: Symbol) -> MatchQueueState
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `queue_id` | `Symbol` |

#### Return Type

`MatchQueueState`

### `queue_depth`
Read the number of players currently waiting in a queue. Missing queues report a depth of 0.

```rust
pub fn queue_depth(env: Env, queue_id: Symbol) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `queue_id` | `Symbol` |

#### Return Type

`u32`

### `player_position_snapshot`
Read a stable player position snapshot for the current queue ordering. Returns None for missing queues, empty queues, or absent players.

```rust
pub fn player_position_snapshot(env: Env, queue_id: Symbol, player: Address) -> Option<QueuePositionSnapshot>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `queue_id` | `Symbol` |
| `player` | `Address` |

#### Return Type

`Option<QueuePositionSnapshot>`

### `match_state`
Read a match record.

```rust
pub fn match_state(env: Env, match_id: u64) -> MatchRecord
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `match_id` | `u64` |

#### Return Type

`MatchRecord`

### `queue_health_snapshot`
Return a health snapshot for a single queue.  All fields are zero-valued when the queue has never been initialised. `active_buckets` is 1 when players are waiting and 0 when the queue is empty. `matches_total` is a lightweight throughput indicator derived from the per-queue match counter updated by `create_match`.

```rust
pub fn queue_health_snapshot(env: Env, queue_id: Symbol) -> QueueHealthSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `queue_id` | `Symbol` |

#### Return Type

`QueueHealthSnapshot`

### `wait_band_estimate`
Return an estimated wait-time band for a queue.  The band is derived from current queue size and prior match history. Outputs are intentionally coarse and conservative so frontends never over-promise exact matchmaking times.  | Condition                         | `wait_band`  | `has_history` | |-----------------------------------|--------------|---------------| | `queue_size >= 2`                 | `Immediate`  | any           | | `queue_size == 1`                 | `Short`      | any           | | `queue_size == 0, matches > 0`    | `Long`       | `true`        | | `queue_size == 0, matches == 0`   | `Unknown`    | `false`       |

```rust
pub fn wait_band_estimate(env: Env, queue_id: Symbol) -> WaitBandEstimate
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `queue_id` | `Symbol` |

#### Return Type

`WaitBandEstimate`

