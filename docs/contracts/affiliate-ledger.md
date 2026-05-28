# affiliate-ledger

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

### `set_paused`
```rust
pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `set_min_payout_threshold`
```rust
pub fn set_min_payout_threshold(env: Env, admin: Address, threshold: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `threshold` | `i128` |

#### Return Type

`Result<(), Error>`

### `set_commission_bps`
```rust
pub fn set_commission_bps(env: Env, admin: Address, bps: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `bps` | `u32` |

#### Return Type

`Result<(), Error>`

### `register_affiliate`
Register a new affiliate.

```rust
pub fn register_affiliate(env: Env, admin: Address, affiliate: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `affiliate` | `Address` |

#### Return Type

`Result<(), Error>`

### `set_affiliate_active`
Set an affiliate's active status.

```rust
pub fn set_affiliate_active(env: Env, admin: Address, affiliate: Address, active: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `affiliate` | `Address` |
| `active` | `bool` |

#### Return Type

`Result<(), Error>`

### `record_referral`
Record a referral event: increment count and add volume with commission.

```rust
pub fn record_referral(env: Env, admin: Address, affiliate: Address, volume: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `affiliate` | `Address` |
| `volume` | `i128` |

#### Return Type

`Result<(), Error>`

### `record_payout`
Mark a payout as processed, reducing the unpaid balance.

```rust
pub fn record_payout(env: Env, admin: Address, affiliate: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `affiliate` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `referral_volume_summary`
Return a referral-volume summary for an affiliate.  Zero-state: `exists` false when no affiliate record is found.

```rust
pub fn referral_volume_summary(env: Env, affiliate: Address) -> ReferralVolumeSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `affiliate` | `Address` |

#### Return Type

`ReferralVolumeSummary`

### `payout_eligibility`
Return payout eligibility for an affiliate.  An affiliate is eligible when they are active and their unpaid balance meets or exceeds the minimum payout threshold.  Zero-state: `eligible` false when affiliate is unknown or inactive.

```rust
pub fn payout_eligibility(env: Env, affiliate: Address) -> PayoutEligibility
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `affiliate` | `Address` |

#### Return Type

`PayoutEligibility`

