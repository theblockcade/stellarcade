# season-rewards-vault

## Public Methods

### `initialize`
Initialize the contract. May only be called once.  `admin` is the only address authorized to manage seasons and rewards.

```rust
pub fn initialize(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `create_season`
Create a new reward season. Admin only.  `season_id` must be unique. `start_time` and `end_time` define the season period. `reward_pool` is the total rewards allocated for the season.

```rust
pub fn create_season(env: Env, admin: Address, season_id: u64, start_time: u64, end_time: u64, reward_pool: i128, auto_rollover: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `season_id` | `u64` |
| `start_time` | `u64` |
| `end_time` | `u64` |
| `reward_pool` | `i128` |
| `auto_rollover` | `bool` |

#### Return Type

`Result<(), Error>`

### `add_reward`
Add a reward for a user in a specific season. Admin only.

```rust
pub fn add_reward(env: Env, admin: Address, season_id: u64, user: Address, amount: i128, reward_type: String, expires_at: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `season_id` | `u64` |
| `user` | `Address` |
| `amount` | `i128` |
| `reward_type` | `String` |
| `expires_at` | `u64` |

#### Return Type

`Result<(), Error>`

### `claim_reward`
Claim a pending reward for a user.

```rust
pub fn claim_reward(env: Env, user: Address, season_id: u64, reward_index: usize) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `season_id` | `u64` |
| `reward_index` | `usize` |

#### Return Type

`Result<(), Error>`

### `process_season_rollover`
Process rollover of unclaimed rewards to the next season. Admin only.

```rust
pub fn process_season_rollover(env: Env, admin: Address, from_season: u64, to_season: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `from_season` | `u64` |
| `to_season` | `u64` |

#### Return Type

`Result<(), Error>`

### `get_claim_queue_snapshot`
Return a snapshot of the claim queue for a season.  This provides comprehensive information about pending claims including total amounts, queue length, and oldest claim age. Returns empty state for unknown seasons.

```rust
pub fn get_claim_queue_snapshot(env: Env, season_id: u64) -> ClaimQueueSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `season_id` | `u64` |

#### Return Type

`ClaimQueueSnapshot`

### `get_rollover_balance_accessor`
Return rollover balance information for a season.  This provides detailed information about rolled over rewards including the amount, reason, and target season. Returns empty state for seasons without rollover.

```rust
pub fn get_rollover_balance_accessor(env: Env, season_id: u64) -> RolloverBalance
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `season_id` | `u64` |

#### Return Type

`RolloverBalance`

### `get_user_claim_summary`
Return a user's claim summary for a season.

```rust
pub fn get_user_claim_summary(env: Env, user: Address, season_id: u64) -> Option<UserClaimSummary>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `season_id` | `u64` |

#### Return Type

`Option<UserClaimSummary>`

### `get_season_config`
Return season configuration.

```rust
pub fn get_season_config(env: Env, season_id: u64) -> Option<SeasonConfig>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `season_id` | `u64` |

#### Return Type

`Option<SeasonConfig>`

### `get_current_season`
Return the current active season ID.

```rust
pub fn get_current_season(env: Env) -> Option<u64>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Option<u64>`

