# reward-stream

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

### `configure_stream`
```rust
pub fn configure_stream(env: Env, admin: Address, stream_id: u64, total_allocated: i128, total_withdrawn: i128, unlock_time: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `stream_id` | `u64` |
| `total_allocated` | `i128` |
| `total_withdrawn` | `i128` |
| `unlock_time` | `u64` |
| `paused` | `bool` |

### `stream_health_summary`
```rust
pub fn stream_health_summary(env: Env) -> StreamHealthSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`StreamHealthSummary`

### `withdrawal_readiness`
```rust
pub fn withdrawal_readiness(env: Env, now: u64) -> WithdrawalReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `now` | `u64` |

#### Return Type

`WithdrawalReadiness`

### `stream_pressure_snapshot`
Return stream pressure and depletion state for the configured stream.  `pressure_bps` uses floored basis-point math: `min(total_withdrawn, total_allocated) * 10_000 / total_allocated`. Missing, empty, or non-positive allocations return a zero pressure and `DepletionBand::NotConfigured` so consumers can render a predictable zero state without treating it as an error.

```rust
pub fn stream_pressure_snapshot(env: Env) -> StreamPressureSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`StreamPressureSnapshot`

### `drip_pressure_summary`
Return a drip-pressure summary for the configured stream.  Missing, empty, or non-positive allocations return a zero pressure and `is_configured = false` so callers can render a predictable zero state.

```rust
pub fn drip_pressure_summary(env: Env) -> DripPressureSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`DripPressureSummary`

### `depletion_band`
Return only the depletion band from `stream_pressure_snapshot`.  This accessor is intentionally narrow for UI badge reads. Missing or not-yet-configured state returns `DepletionBand::NotConfigured`.

```rust
pub fn depletion_band(env: Env) -> DepletionBand
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`DepletionBand`

### `pause_recovery_accessor`
Return a pause-recovery view for the configured stream.  Missing, empty, or non-positive allocations return a zero state with `is_configured = false`.

```rust
pub fn pause_recovery_accessor(env: Env, now: u64) -> PauseRecoveryAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `now` | `u64` |

#### Return Type

`PauseRecoveryAccessor`

### `stream_performance_summary`
Return stream performance metrics for the configured stream.  `utilization_bps` uses the same floored basis-point math as `stream_pressure_snapshot`. Missing or zero-allocation streams return `is_configured = false` with all zeros.

```rust
pub fn stream_performance_summary(env: Env) -> StreamPerformanceSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`StreamPerformanceSummary`

### `unlock_interval_accessor`
Return unlock-interval details for the configured stream.  `time_until_unlock` is `unlock_time.saturating_sub(now)`, clamped to zero once past the unlock point. Missing streams return `is_configured = false` with all zeros.

```rust
pub fn unlock_interval_accessor(env: Env, now: u64) -> UnlockIntervalAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `now` | `u64` |

#### Return Type

`UnlockIntervalAccessor`

