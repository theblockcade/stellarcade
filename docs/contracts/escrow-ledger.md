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

