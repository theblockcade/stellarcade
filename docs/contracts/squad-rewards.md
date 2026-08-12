# squad-rewards

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

### `fund_pool`
```rust
pub fn fund_pool(env: Env, admin: Address, amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `amount` | `i128` |

### `register_members`
```rust
pub fn register_members(env: Env, admin: Address, payouts: Vec<MemberPayout>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `payouts` | `Vec<MemberPayout>` |

### `claim`
```rust
pub fn claim(env: Env, member_index: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `member_index` | `u32` |

### `team_payout_coverage`
```rust
pub fn team_payout_coverage(env: Env) -> TeamPayoutCoverage
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`TeamPayoutCoverage`

### `claim_readiness`
```rust
pub fn claim_readiness(env: Env) -> ClaimReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ClaimReadiness`

