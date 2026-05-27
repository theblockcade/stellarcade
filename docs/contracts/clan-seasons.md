# clan-seasons

## Public Methods

### `init`
Initialize the contract. May only be called once.

```rust
pub fn init(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `upsert_season`
Write or update a season record. Admin only.  Existing records are fully replaced. Callers may read, modify, then re-submit to update individual fields.

```rust
pub fn upsert_season(env: Env, admin: Address, season_id: u32, carryover_xp: u32, carryover_rank: u32, season_end_ledger: u32, was_locked: bool, lock_ledger: u32, is_locked: bool, locked_member_count: u32, lock_reason_code: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `season_id` | `u32` |
| `carryover_xp` | `u32` |
| `carryover_rank` | `u32` |
| `season_end_ledger` | `u32` |
| `was_locked` | `bool` |
| `lock_ledger` | `u32` |
| `is_locked` | `bool` |
| `locked_member_count` | `u32` |
| `lock_reason_code` | `u32` |

#### Return Type

`Result<(), Error>`

### `season_carryover_snapshot`
Return the carryover snapshot for `season_id`.  Unknown season ids return `exists = false` with zeroed numeric fields. `was_locked` surfaces whether the roster was locked when the season ended.

```rust
pub fn season_carryover_snapshot(env: Env, season_id: u32) -> SeasonCarryoverSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `season_id` | `u32` |

#### Return Type

`SeasonCarryoverSnapshot`

### `roster_lock`
Return the roster-lock state for `season_id`.  Unknown season ids return `exists = false` with zeroed numeric fields. `lock_reason_code`: 0 = not locked, 1 = season-end lock, 2 = admin lock.

```rust
pub fn roster_lock(env: Env, season_id: u32) -> RosterLock
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `season_id` | `u32` |

#### Return Type

`RosterLock`

