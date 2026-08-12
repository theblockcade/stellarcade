# creator-vaults

## Public Methods

### `deposit`
Locks additional funds into the caller's vault. The unlock time only ever moves later, so an existing lock cannot be shortened by a new deposit.

```rust
pub fn deposit(env: Env, creator: Address, amount: i128, unlock_time: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `amount` | `i128` |
| `unlock_time` | `u64` |

### `withdraw`
Withdraws the full locked balance once the unlock time has passed.

```rust
pub fn withdraw(env: Env, creator: Address) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |

#### Return Type

`i128`

### `liability_summary`
Aggregate vault liability: total/active vault counts, total locked, and the portion currently unlockable at the present ledger timestamp.

```rust
pub fn liability_summary(env: Env) -> VaultLiabilitySummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`VaultLiabilitySummary`

### `unlock_readiness`
Unlock readiness for a single creator's vault. Returns a predictable zero-state result when the vault does not exist.

```rust
pub fn unlock_readiness(env: Env, creator: Address) -> UnlockReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |

#### Return Type

`UnlockReadiness`

### `get_vault_state`
Reads a single vault, returning an empty default when missing.

```rust
pub fn get_vault_state(env: Env, creator: Address) -> Vault
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |

#### Return Type

`Vault`

### `vault_reserve_summary`
Reserve health for a single vault against a caller-supplied minimum.  Returns `meets_reserve: false` and a `shortfall` when the vault does not exist, is inactive, or is below `min_reserve`.

```rust
pub fn vault_reserve_summary(env: Env, creator: Address, min_reserve: i128) -> VaultReserveSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `min_reserve` | `i128` |

#### Return Type

`VaultReserveSummary`

### `depletion_gap_accessor`
Depletion gap for a single vault: unlockable vs. still-locked amounts.  Returns zeroed amounts with `vault_exists: false` when the vault does not exist.

```rust
pub fn depletion_gap_accessor(env: Env, creator: Address) -> DepletionGapAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |

#### Return Type

`DepletionGapAccessor`

