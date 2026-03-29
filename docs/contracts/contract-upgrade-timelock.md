# contract-upgrade-timelock

## Public Methods

### `init`
Initialize with admin and minimum timelock delay (seconds).

```rust
pub fn init(env: Env, admin: Address, min_delay: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `min_delay` | `u64` |

### `queue_upgrade`
Queue an upgrade proposal. Admin-only. `eta` must be at least `now + min_delay`.

```rust
pub fn queue_upgrade(env: Env, target_contract: Address, payload_hash: Symbol, eta: u64) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target_contract` | `Address` |
| `payload_hash` | `Symbol` |
| `eta` | `u64` |

#### Return Type

`u64`

### `cancel_upgrade`
Cancel a queued upgrade. Admin-only.

```rust
pub fn cancel_upgrade(env: Env, upgrade_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `upgrade_id` | `u64` |

### `execute_upgrade`
Execute a queued upgrade after the timelock has elapsed. Admin-only.

```rust
pub fn execute_upgrade(env: Env, upgrade_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `upgrade_id` | `u64` |

### `upgrade_state`
Read the state of an upgrade record.

```rust
pub fn upgrade_state(env: Env, upgrade_id: u64) -> UpgradeRecord
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `upgrade_id` | `u64` |

#### Return Type

`UpgradeRecord`

### `get_queued_upgrade`
Returns a single-read snapshot of a queued upgrade, including a readiness flag.

```rust
pub fn get_queued_upgrade(env: Env, upgrade_id: u64) -> Option<QueuedUpgradeView>
```

Returns `None` in two deterministic cases:
- No record exists for `upgrade_id` (never queued).
- The upgrade exists but is no longer in `Queued` status (already executed or cancelled).

When `Some` is returned, the `is_ready` field is `true` iff `current_ledger_timestamp >= eta`, meaning the upgrade may be executed immediately. Consumers should treat `is_ready = false` as "still within the timelock window" and must not attempt execution.

The entire view is computed in a single storage read, so there is no risk of partial state within a single call/snapshot.

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `upgrade_id` | `u64` |

#### Return Type

`Option<QueuedUpgradeView>`

#### `QueuedUpgradeView` fields

| Field | Type | Description |
|-------|------|-------------|
| `upgrade_id` | `u64` | Identifier of the queued upgrade |
| `target_contract` | `Address` | Contract address targeted by the upgrade |
| `queued_at_ledger` | `u32` | Ledger sequence number when the upgrade was queued |
| `eta` | `u64` | Earliest timestamp (seconds) at which execution is permitted |
| `is_ready` | `bool` | `true` when `now >= eta`; `false` while still within the timelock window |

