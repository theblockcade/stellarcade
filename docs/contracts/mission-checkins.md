# mission-checkins

## Public Methods

### `configure_mission`
Configures a new mission with a reset interval (seconds). A reset interval of 0 disables window resets (counts accumulate forever).

```rust
pub fn configure_mission(env: Env, id: u64, reset_interval: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `reset_interval` | `u64` |

### `check_in`
Records a check-in by `user`. Rolls the window forward (resetting the counters) when the reset interval has elapsed, then counts the check-in and, if the user is new for this window, a unique participant.

```rust
pub fn check_in(env: Env, id: u64, user: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `user` | `Address` |

### `participation_summary`
Participation totals for the current window; predictable zero-state when the mission does not exist.

```rust
pub fn participation_summary(env: Env, id: u64) -> ParticipationSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`ParticipationSummary`

### `reset_window`
The current reset window and time remaining until it rolls over.

```rust
pub fn reset_window(env: Env, id: u64) -> ResetWindow
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`ResetWindow`

### `check_in_frequency_snapshot`
Check-in rate snapshot: checkins per 1000 seconds and unique-participant ratio in bps for the current window.

```rust
pub fn check_in_frequency_snapshot(env: Env, id: u64) -> CheckInFrequencySnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`CheckInFrequencySnapshot`

### `streak_decay`
Whether `user`'s streak would be lost if they miss the current window.

```rust
pub fn streak_decay(env: Env, id: u64, user: Address) -> StreakDecay
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `user` | `Address` |

#### Return Type

`StreakDecay`

