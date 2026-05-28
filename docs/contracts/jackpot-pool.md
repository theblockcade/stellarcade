# jackpot-pool

## Public Methods

### `init`
Initialise the jackpot pool.  `min_draw_target` is the minimum token balance required before a draw can be triggered.

```rust
pub fn init(env: Env, admin: Address, token: Address, min_draw_target: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `token` | `Address` |
| `min_draw_target` | `i128` |

#### Return Type

`Result<(), Error>`

### `contribute`
Contribute tokens to the jackpot pool.  Tracks per-address totals, global totals, and updates the top contributor record if this contribution exceeds the current maximum.

```rust
pub fn contribute(env: Env, contributor: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contributor` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `reset_round`
Admin resets the pool after a payout. Clears all contribution accounting for the round; per-address entries remain readable but the aggregate counters reset to zero.

```rust
pub fn reset_round(env: Env, admin: Address) -> Result<u32, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<u32, Error>`

### `contributor_breakdown`
Return a breakdown of contributor metrics for the current round.  `top_contributor_share_bps` is computed as `(top_contribution * 10_000) / total_contributed` (integer division). Returns zeroed fields when the pool has not been seeded.

```rust
pub fn contributor_breakdown(env: Env) -> ContributorSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ContributorSummary`

### `funding_snapshot`
Return a funding snapshot for the next draw.  Returns zeroed fields when the contract has not been initialised. `shortfall` is `max(0, minimum_target − current_funded)`.

```rust
pub fn funding_snapshot(env: Env) -> FundingSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`FundingSnapshot`

