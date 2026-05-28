# fee-shield

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

### `upsert_shield`
Create or update a protected fee balance. Historical fee counters are preserved across updates so the read accessors remain cumulative.

```rust
pub fn upsert_shield(env: Env, admin: Address, shield_id: u64, protected_balance: i128, current_balance: i128, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `shield_id` | `u64` |
| `protected_balance` | `i128` |
| `current_balance` | `i128` |
| `paused` | `bool` |

### `top_up`
Add new balance to an existing fee shield without changing the protected floor.

```rust
pub fn top_up(env: Env, admin: Address, shield_id: u64, amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `shield_id` | `u64` |
| `amount` | `i128` |

### `charge_fee`
Deduct a fee from the spendable buffer. The protected floor is never crossed; once `spendable_balance` hits zero the workflow is blocked.

```rust
pub fn charge_fee(env: Env, admin: Address, shield_id: u64, amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `shield_id` | `u64` |
| `amount` | `i128` |

### `protected_balance_summary`
Return a stable protected-balance summary for `shield_id`.  Before `init` this returns `configured = false` and `state = NotConfigured`. Unknown ids after initialization return `exists = false` with zero balances. `spendable_balance` is `current_balance - protected_balance` and therefore reaches zero exactly when additional fee charges must stop.

```rust
pub fn protected_balance_summary(env: Env, shield_id: u64) -> ProtectedBalanceSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `shield_id` | `u64` |

#### Return Type

`ProtectedBalanceSummary`

### `depletion_risk`
Return a compact depletion-risk view for `shield_id`.  `spendable_bps` uses floor division in basis points: `spendable_balance * 10_000 / current_balance`. Zero-balance, missing, and not-yet-configured states return `spendable_bps = 0`.

```rust
pub fn depletion_risk(env: Env, shield_id: u64) -> DepletionRisk
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `shield_id` | `u64` |

#### Return Type

`DepletionRisk`

