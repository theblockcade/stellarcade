# voucher-escrow

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

### `reserve`
Reserve a voucher in escrow. Admin only.

```rust
pub fn reserve(env: Env, admin: Address, holder: Address, reserved_amount: i128, expiry_ledger: u32) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `holder` | `Address` |
| `reserved_amount` | `i128` |
| `expiry_ledger` | `u32` |

#### Return Type

`u64`

### `claim`
Claim an escrowed voucher. Caller must be the holder.

```rust
pub fn claim(env: Env, holder: Address, voucher_id: u64) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `holder` | `Address` |
| `voucher_id` | `u64` |

#### Return Type

`i128`

### `reserved_voucher_summary`
Reserved voucher summary: total reserved, active/expired/claimed counts.

```rust
pub fn reserved_voucher_summary(env: Env) -> ReservedVoucherSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ReservedVoucherSummary`

### `expiry_pressure`
Expiry pressure for a specific voucher: ledgers remaining, expired flag.

```rust
pub fn expiry_pressure(env: Env, voucher_id: u64) -> ExpiryPressure
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `voucher_id` | `u64` |

#### Return Type

`ExpiryPressure`

