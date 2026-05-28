# Treasury Safeguard Contract

The Treasury Safeguard contract provides threshold-based protection and cooldown mechanisms for treasury operations.

## Public Interface

### `init(admin: Address, threshold_limit: i128, cooldown_period: u64)`
Initializes the safeguard with an admin, a threshold limit for breaches, and a cooldown duration.

- Requires `admin` auth.
- Sets `paused` to `false`.

### `set_paused(admin: Address, paused: bool)`
Toggles the paused state of the safeguard.

- Admin only.
- When paused, `record_activity` and `reset_safeguard` are blocked.

### `get_threshold_breach_summary() -> ThresholdBreachSummary`
Returns a structured summary of the current threshold breach state.

```rust
pub struct ThresholdBreachSummary {
    pub is_breached: bool,
    pub breach_count: u32,
    pub last_breach_timestamp: u64,
    pub threshold_value: i128,
    pub current_value: i128,
    pub is_paused: bool,
}
```

### `get_cooldown_release() -> CooldownRelease`
Returns the current cooldown status.

```rust
pub struct CooldownRelease {
    pub is_in_cooldown: bool,
    pub cooldown_end_timestamp: u64,
    pub remaining_seconds: u64,
    pub is_paused: bool,
}
```

### `record_activity(admin: Address, value: i128)`
Administrative method to record activity and check for breaches.

- Admin only.
- If `value >= threshold_limit`, increments breach count and sets cooldown.
- Blocked if paused.

### `reset_safeguard(admin: Address)`
Resets the breach state and clears cooldown.

- Admin only.
- Blocked if paused.

## Build and Test

```bash
cargo +nightly test -p stellarcade-treasury-safeguard
```
