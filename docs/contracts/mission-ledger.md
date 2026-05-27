# mission-ledger

## Public Methods

### `init`
Initialise the ledger with an admin who can register / pause missions.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `register_mission`
Register a new mission. Idempotent only on duplicate `mission_id` — re-registration with a different id is allowed.

```rust
pub fn register_mission(env: Env, admin: Address, mission_id: u64, operator: Address, completion_threshold: u32, reward_amount: i128, reward_token: Address, expires_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `mission_id` | `u64` |
| `operator` | `Address` |
| `completion_threshold` | `u32` |
| `reward_amount` | `i128` |
| `reward_token` | `Address` |
| `expires_at` | `u64` |

### `record_progress`
Record incremental progress for `player` against `mission_id`.  `progress_delta` is added to the player's running counter; the contract caps the stored value at `completion_threshold` so external counters can over-report without breaking readiness semantics.

```rust
pub fn record_progress(env: Env, player: Address, mission_id: u64, progress_delta: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `mission_id` | `u64` |
| `progress_delta` | `u32` |

### `set_paused`
Mark a mission paused / unpaused. Pausing leaves the record in place but blocks `record_progress` and `claim`.

```rust
pub fn set_paused(env: Env, admin: Address, mission_id: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `mission_id` | `u64` |
| `paused` | `bool` |

### `claim`
Claim the reward for a completed mission. Idempotent on `(mission_id, player)`.

```rust
pub fn claim(env: Env, player: Address, mission_id: u64) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `mission_id` | `u64` |

#### Return Type

`i128`

### `mission_snapshot`
Snapshot of the on-chain mission state. Suitable for direct rendering on the frontend dashboard without ad-hoc joins.

```rust
pub fn mission_snapshot(env: Env, mission_id: u64) -> MissionSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `mission_id` | `u64` |

#### Return Type

`MissionSnapshot`

### `reward_claim_ready`
Whether `player` can claim the reward for `mission_id`. Returns a structured reason regardless of the boolean outcome so observability tooling can log the exact gating condition.

```rust
pub fn reward_claim_ready(env: Env, mission_id: u64, player: Address) -> ClaimReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `mission_id` | `u64` |
| `player` | `Address` |

#### Return Type

`ClaimReadiness`

