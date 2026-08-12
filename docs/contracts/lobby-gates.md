# lobby-gates

## Public Methods

### `configure_gate`
Configures a new gate with a capacity and a release time. Panics if it already exists.

```rust
pub fn configure_gate(env: Env, id: u64, capacity: u32, release_time: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `capacity` | `u32` |
| `release_time` | `u64` |

### `enter`
Admits a player once the gate is open (released and not paused) and has remaining capacity. Idempotent per player — re-entering is a no-op.

```rust
pub fn enter(env: Env, id: u64, player: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `player` | `Address` |

### `set_paused`
Pauses or unpauses a gate.

```rust
pub fn set_paused(env: Env, id: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `paused` | `bool` |

### `gate_status`
Gate status snapshot; predictable zero-state when the gate is missing.

```rust
pub fn gate_status(env: Env, id: u64) -> GateStatusSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`GateStatusSnapshot`

### `entry_status_summary`
Entry status summary: occupancy, capacity, and whether entry is allowed.

```rust
pub fn entry_status_summary(env: Env, id: u64) -> EntryStatusSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`EntryStatusSummary`

### `unlock_delay`
Time remaining until a gate is fully unlocked (released AND not paused).

```rust
pub fn unlock_delay(env: Env, id: u64) -> UnlockDelay
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`UnlockDelay`

### `release_delay`
Time remaining until a gate releases.

```rust
pub fn release_delay(env: Env, id: u64) -> ReleaseDelay
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`ReleaseDelay`

