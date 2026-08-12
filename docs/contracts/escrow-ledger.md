# escrow-ledger

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

### `deposit`
```rust
pub fn deposit(env: Env, escrow_id: u64, payor: Address, payee: Address, amount: i128, locked_until: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `escrow_id` | `u64` |
| `payor` | `Address` |
| `payee` | `Address` |
| `amount` | `i128` |
| `locked_until` | `u64` |

### `settle`
```rust
pub fn settle(env: Env, admin: Address, escrow_id: u64) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `escrow_id` | `u64` |

#### Return Type

`i128`

### `liability_summary`
```rust
pub fn liability_summary(env: Env) -> LiabilitySummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`LiabilitySummary`

### `ledger_balance_summary`
```rust
pub fn ledger_balance_summary(env: Env) -> LedgerBalanceSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`LedgerBalanceSummary`

### `dispute_window_accessor`
```rust
pub fn dispute_window_accessor(env: Env, escrow_id: u64, dispute_window_secs: u64) -> DisputeWindowAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `escrow_id` | `u64` |
| `dispute_window_secs` | `u64` |

#### Return Type

`DisputeWindowAccessor`

### `settlement_window`
```rust
pub fn settlement_window(env: Env, escrow_id: u64) -> SettlementWindow
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `escrow_id` | `u64` |

#### Return Type

`SettlementWindow`

