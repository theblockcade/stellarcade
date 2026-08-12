# referral-rewards

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address, min_claim_amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `min_claim_amount` | `i128` |

### `record_earning`
```rust
pub fn record_earning(env: Env, admin: Address, inviter: Address, amount: i128, active_referees: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `inviter` | `Address` |
| `amount` | `i128` |
| `active_referees` | `u32` |

### `record_claim`
```rust
pub fn record_claim(env: Env, admin: Address, inviter: Address, amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `inviter` | `Address` |
| `amount` | `i128` |

### `inviter_earnings_summary`
```rust
pub fn inviter_earnings_summary(env: Env, inviter: Address) -> InviterEarningsSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `inviter` | `Address` |

#### Return Type

`InviterEarningsSummary`

### `claim_readiness`
```rust
pub fn claim_readiness(env: Env, inviter: Address) -> ClaimReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `inviter` | `Address` |

#### Return Type

`ClaimReadiness`

### `get_reward_tier_summary`
```rust
pub fn get_reward_tier_summary(_env: Env, _inviter: Address) -> RewardTierSummary
```

#### Parameters

| Name | Type |
|------|------|
| `_env` | `Env` |
| `_inviter` | `Address` |

#### Return Type

`RewardTierSummary`

### `get_payout_window`
```rust
pub fn get_payout_window(_env: Env) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `_env` | `Env` |

#### Return Type

`u32`

