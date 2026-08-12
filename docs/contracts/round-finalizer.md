# round-finalizer

## Public Methods

### `initialize`
```rust
pub fn initialize(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

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

### `upsert_round`
```rust
pub fn upsert_round(env: Env, admin: Address, round_id: u64, unresolved_ops: u32, has_checkpoint: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `round_id` | `u64` |
| `unresolved_ops` | `u32` |
| `has_checkpoint` | `bool` |

### `get_unresolved_round_summary`
```rust
pub fn get_unresolved_round_summary(env: Env) -> UnresolvedRoundSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`UnresolvedRoundSummary`

### `get_finalize_readiness`
```rust
pub fn get_finalize_readiness(env: Env, round_id: u64) -> FinalizeReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `round_id` | `u64` |

#### Return Type

`FinalizeReadiness`

### `active_round_summary`
Return a dashboard-friendly active round summary.  Active rounds have unresolved operations or lack a checkpoint. Ready rounds have zero unresolved operations and a checkpoint. Empty and unconfigured states return zero counts.

```rust
pub fn active_round_summary(env: Env) -> ActiveRoundSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ActiveRoundSummary`

### `dispute_window_ledgers`
Return the dispute window in ledgers.  The dispute window is the period after a round is marked ready during which challenges may be raised. It is a fixed contract constant so consumers do not need to hard-code it out-of-band.

```rust
pub fn dispute_window_ledgers(_env: Env) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `_env` | `Env` |

#### Return Type

`u32`

### `finalization_status_summary`
Return a finalization-status summary for dashboard consumers.  Counts finalized rounds (zero unresolved ops, has checkpoint) vs unresolved, and surfaces the dispute window constant alongside paused state.

```rust
pub fn finalization_status_summary(env: Env) -> FinalizationStatusSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`FinalizationStatusSummary`

### `finalization_pressure`
Return aggregate pressure against round finalization.  Pressure is floored basis-point math over blocked rounds. A paused contract marks all stored rounds as blocked; empty state returns zero.

```rust
pub fn finalization_pressure(env: Env) -> FinalizationPressure
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`FinalizationPressure`

