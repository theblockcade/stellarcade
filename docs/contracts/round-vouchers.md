# round-vouchers

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

### `upsert_round`
```rust
pub fn upsert_round(env: Env, admin: Address, round_id: u32, max_vouchers: u64, redeemable_after: u64, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `round_id` | `u32` |
| `max_vouchers` | `u64` |
| `redeemable_after` | `u64` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `issue_voucher`
```rust
pub fn issue_voucher(env: Env, admin: Address, voucher_id: u64, round_id: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `voucher_id` | `u64` |
| `round_id` | `u32` |

#### Return Type

`Result<(), Error>`

### `redeem_voucher`
```rust
pub fn redeem_voucher(env: Env, admin: Address, voucher_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `voucher_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `voucher_issuance_summary`
```rust
pub fn voucher_issuance_summary(env: Env, round_id: u32) -> VoucherIssuanceSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `round_id` | `u32` |

#### Return Type

`VoucherIssuanceSummary`

### `redemption_gap_accessor`
```rust
pub fn redemption_gap_accessor(env: Env, voucher_id: u64) -> RedemptionGapAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `voucher_id` | `u64` |

#### Return Type

`RedemptionGapAccessor`

