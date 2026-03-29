# balance-management

## Public Methods

### `update_balance`
Update user balance (Internal use by other contracts).

```rust
pub fn update_balance(env: Env, user: Address, amount: i128, is_add: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `amount` | `i128` |
| `is_add` | `bool` |

#### Behavior

- Read-only callers are not affected; this method mutates account state.
- `amount` must be non-negative.
- When `is_add = true`, `amount` is added to the current balance.
- When `is_add = false`, `amount` is subtracted from the current balance.
- `last_update` is written as the current ledger sequence whenever a mutation succeeds.

### `get_balance`
View user balance.

```rust
pub fn get_balance(env: Env, user: Address) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`i128`

#### Behavior

- Returns `0` - when no account state exists yet for `user`.

### `get_account_summary`
Return a compact, deterministic account snapshot for backend consumers.

```rust
pub fn get_account_summary(env: Env, user: Address) -> AccountSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

```rust
pub struct AccountSummary {
    pub exists: bool,
    pub balance: i128,
    pub reserved: i128,
    pub last_update: u32,
}
```

#### Summary Contract (backend-facing)

- **Read-only and deterministic:** no side effects and output depends only on stored state.
- **Unknown account distinction:**
  - Unknown account → `exists = false`, `balance = 0`, `reserved = 0`, `last_update = 0`.
  - Known zeroed account → `exists = true` (e.g. account mutated but ended at zero).
- **Typed-client stability:** the response shape is a fixed struct with concrete scalar fields (`bool`, `i128`, `u32`).
