# prize-ledger-v2

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

### `record_prize`
```rust
pub fn record_prize(env: Env, admin: Address, prize_id: u64, recipient: Address, amount: i128, payout_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `prize_id` | `u64` |
| `recipient` | `Address` |
| `amount` | `i128` |
| `payout_at` | `u64` |

### `mark_paid`
```rust
pub fn mark_paid(env: Env, admin: Address, prize_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `prize_id` | `u64` |

### `liability_rollup_summary`
```rust
pub fn liability_rollup_summary(env: Env) -> LiabilityRollupSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`LiabilityRollupSummary`

### `payout_window_accessor`
```rust
pub fn payout_window_accessor(env: Env, prize_id: u64, window_ledgers: u32) -> PayoutWindowAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `prize_id` | `u64` |
| `window_ledgers` | `u32` |

#### Return Type

`PayoutWindowAccessor`

