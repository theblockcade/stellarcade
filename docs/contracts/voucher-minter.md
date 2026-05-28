# voucher-minter

## Public Methods

### `init`
Initialize the contract. May only be called once.

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

### `upsert_voucher_type`
Define or update a voucher type. Admin only.  `max_supply = 0` means uncapped. Existing `total_issued` is preserved on update so supply counters remain consistent.

```rust
pub fn upsert_voucher_type(env: Env, admin: Address, type_id: u32, max_supply: u64, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `type_id` | `u32` |
| `max_supply` | `u64` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `issue_voucher`
Issue a voucher instance. Admin only.  Increments `total_issued` on the parent type and writes the per-voucher record. Fails if the type is paused or supply is exhausted.

```rust
pub fn issue_voucher(env: Env, admin: Address, voucher_id: u64, type_id: u32, expires_at_ledger: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `voucher_id` | `u64` |
| `type_id` | `u32` |
| `expires_at_ledger` | `u32` |

#### Return Type

`Result<(), Error>`

### `claim_voucher`
Mark a voucher as claimed. Admin only.

```rust
pub fn claim_voucher(env: Env, admin: Address, voucher_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `voucher_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `issuance_summary`
Return an issuance summary for `voucher_type_id`.  Unknown type ids return `exists = false` with zeroed fields. `remaining` is `u64::MAX` when the type is uncapped (`max_supply == 0`).

```rust
pub fn issuance_summary(env: Env, voucher_type_id: u32) -> IssuanceSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `voucher_type_id` | `u32` |

#### Return Type

`IssuanceSummary`

### `claim_expiry`
Return claim-expiry details for `voucher_id`.  Unknown voucher ids return `exists = false` with zeroed fields. `is_expired` is computed against the current ledger sequence at read time: `current_ledger >= expires_at_ledger`.

```rust
pub fn claim_expiry(env: Env, voucher_id: u64) -> ClaimExpiry
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `voucher_id` | `u64` |

#### Return Type

`ClaimExpiry`

