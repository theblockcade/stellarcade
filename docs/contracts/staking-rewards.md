# staking-rewards

## Public Methods

### `init`
Initialise the staking rewards contract.

```rust
pub fn init(env: Env, admin: Address, staking_token: Address, reward_token: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `staking_token` | `Address` |
| `reward_token` | `Address` |

#### Return Type

`Result<(), Error>`

### `start_epoch`
Admin starts a new reward epoch, depositing `total_rewards` tokens.  Only one epoch may be active at a time. The current total staked amount is snapshotted for proportional reward calculations.

```rust
pub fn start_epoch(env: Env, admin: Address, total_rewards: i128, end_timestamp: u64) -> Result<u64, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `total_rewards` | `i128` |
| `end_timestamp` | `u64` |

#### Return Type

`Result<u64, Error>`

### `stake`
Stake tokens to participate in the current and future reward epochs.

```rust
pub fn stake(env: Env, staker: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `staker` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `unstake`
Unstake tokens. Forfeits any unclaimed rewards in the active epoch.

```rust
pub fn unstake(env: Env, staker: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `staker` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `claim_rewards`
Claim the staker's proportional share from the current epoch.  Epoch must be active. Staker receives `(staked_amount * total_rewards) / total_staked_snapshot` tokens (integer division; any remainder stays in the contract as carry-over for the next epoch).

```rust
pub fn claim_rewards(env: Env, staker: Address) -> Result<i128, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `staker` | `Address` |

#### Return Type

`Result<i128, Error>`

### `end_epoch`
Admin closes the current epoch.

```rust
pub fn end_epoch(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `reward_projection`
Return a deterministic reward projection for a staker.  Computes the staker's proportional share of current epoch rewards based on their current staked amount and the epoch's total staked snapshot. Returns zeroed values when no epoch has been started.  Rounding: integer division is used throughout; any fractional token is truncated and remains in the contract as carry-over.

```rust
pub fn reward_projection(env: Env, staker: Address) -> RewardProjection
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `staker` | `Address` |

#### Return Type

`RewardProjection`

### `epoch_summary`
Return a summary of the current epoch's accounting state.  `pending_carry_over` is the portion of epoch rewards not yet claimed. When no epoch has started all fields return zero or `false`.

```rust
pub fn epoch_summary(env: Env) -> EpochSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`EpochSummary`

