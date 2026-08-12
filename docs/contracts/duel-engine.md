# duel-engine

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

### `create_duel`
```rust
pub fn create_duel(env: Env, admin: Address, duel_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `duel_id` | `u64` |

### `resolve_duel`
```rust
pub fn resolve_duel(env: Env, admin: Address, duel_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `duel_id` | `u64` |

### `set_paused`
```rust
pub fn set_paused(env: Env, admin: Address, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `paused` | `bool` |

### `open_duel_summary`
```rust
pub fn open_duel_summary(env: Env) -> OpenDuelSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`OpenDuelSummary`

### `resolution_readiness`
```rust
pub fn resolution_readiness(env: Env, duel_id: u64) -> ResolutionReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `duel_id` | `u64` |

#### Return Type

`ResolutionReadiness`

### `challenge_timeout`
Returns the configured challenge timeout (defaults to 0 if not set).

```rust
pub fn challenge_timeout(env: Env) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`u64`

### `set_challenge_timeout`
Set the challenge timeout (in seconds). Admin only.

```rust
pub fn set_challenge_timeout(env: Env, admin: Address, timeout: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `timeout` | `u64` |

### `duel_state_summary`
Detailed summary of the current duel engine state.

```rust
pub fn duel_state_summary(env: Env) -> DuelStateSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`DuelStateSummary`

