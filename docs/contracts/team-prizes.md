# team-prizes

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

### `upsert_pool`
Create or update a pool. On update, `total_amount` may only increase (admins can top up but cannot retroactively reduce a pool members were eligible for). Claimed totals are preserved across updates.

```rust
pub fn upsert_pool(env: Env, admin: Address, pool_id: u32, total_amount: u128, claim_delay_secs: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `pool_id` | `u32` |
| `total_amount` | `u128` |
| `claim_delay_secs` | `u64` |
| `paused` | `bool` |

### `grant_eligibility`
Grant `member` an eligibility slot for `pool_id` with the given share. Idempotent on `(pool_id, member)`: a second call panics so the eligible count stays consistent.

```rust
pub fn grant_eligibility(env: Env, admin: Address, member: Address, pool_id: u32, share_amount: u128, eligible_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `member` | `Address` |
| `pool_id` | `u32` |
| `share_amount` | `u128` |
| `eligible_at` | `u64` |

### `claim`
Mark a member's share as claimed. Reverts if the claim window has not opened, the pool is paused, the member is missing, or the member has already claimed.

```rust
pub fn claim(env: Env, member: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `member` | `Address` |

### `prize_pool_coverage`
Pool-level coverage view.  `coverage_bps = floor(10_000 * claimed_amount / total_amount)` when `total_amount > 0`, otherwise 0. The unclaimed member count is derived as `eligible - claimed` and surfaced as a single field.

```rust
pub fn prize_pool_coverage(env: Env, pool_id: u32) -> PrizePoolCoverage
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `pool_id` | `u32` |

#### Return Type

`PrizePoolCoverage`

### `prize_allocation_summary`
Prize allocation view for a pool.  `avg_share_per_member = floor(total_amount / eligible_member_count)`, or zero when no members are eligible. `fully_distributed` is true when every eligible member has claimed. Unknown pools return `pool_found = false`.

```rust
pub fn prize_allocation_summary(env: Env, pool_id: u32) -> PrizeAllocationSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `pool_id` | `u32` |

#### Return Type

`PrizeAllocationSummary`

### `claim_expiry_accessor`
Claim-expiry view for a member.  This contract has no hard expiry on claims; `has_expiry` is always `false` and `expires_at` is always `0`. The accessor provides a stable surface for future expiry support without a breaking interface change.

```rust
pub fn claim_expiry_accessor(env: Env, member: Address) -> ClaimExpiryInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `member` | `Address` |

#### Return Type

`ClaimExpiryInfo`

### `claim_delay_accessor`
Per-member claim-delay view. See [`ClaimDelayState`] for branches.

```rust
pub fn claim_delay_accessor(env: Env, member: Address) -> ClaimDelayInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `member` | `Address` |

#### Return Type

`ClaimDelayInfo`

