# creator-royalties

## Public Methods

### `init`
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

### `configure`
Register or update the royalty rate for a creator's asset. `rate_bps` must be in 0..=10_000.

```rust
pub fn configure(env: Env, creator: Address, rate_bps: u32, token: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `rate_bps` | `u32` |
| `token` | `Address` |

#### Return Type

`Result<(), Error>`

### `record_accrual`
Record royalties accrued on behalf of a creator (admin-only). Typically called by the platform after each qualifying sale.

```rust
pub fn record_accrual(env: Env, creator: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `set_payout_interval`
Set the minimum interval (in ledgers) between payouts for a creator. Must be called by the creator.

```rust
pub fn set_payout_interval(env: Env, creator: Address, interval_ledgers: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `interval_ledgers` | `u32` |

#### Return Type

`Result<(), Error>`

### `schedule_payout`
Queue a scheduled payout entry (admin-only).

```rust
pub fn schedule_payout(env: Env, creator: Address, claimable_at_ledger: u32, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `claimable_at_ledger` | `u32` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `claim_scheduled`
Claim all schedule entries whose `claimable_at_ledger` has passed. Must be called by the creator.

```rust
pub fn claim_scheduled(env: Env, creator: Address) -> Result<i128, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |

#### Return Type

`Result<i128, Error>`

### `accrual_summary`
Returns a full accrual summary for a creator.  Unknown or not-yet-configured creators return a zeroed summary with `exists = false`. In that case `token` is a placeholder value copied from the queried creator address, so consumers must branch on `exists` before using token-specific fields.

```rust
pub fn accrual_summary(env: Env, creator: Address) -> AccrualSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |

#### Return Type

`AccrualSummary`

### `payout_schedule`
Returns the payout schedule for a creator.  Unknown or not-yet-configured creators return `exists = false`, `interval_ledgers = 0`, and an empty `pending_entries` list. Configured creators with no scheduled entries return `exists = true` and the same zero-value schedule fields.

```rust
pub fn payout_schedule(env: Env, creator: Address) -> PayoutSchedule
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |

#### Return Type

`PayoutSchedule`

