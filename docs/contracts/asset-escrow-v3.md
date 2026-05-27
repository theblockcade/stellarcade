# asset-escrow-v3

## Public Methods

### `init`
Initialize the contract with a super admin. Can only be called once.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `get_admin`
Get the current admin.

```rust
pub fn get_admin(env: Env) -> Address
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Address`

### `create_lock`
Create a new lock entry for a beneficiary.

```rust
pub fn create_lock(env: Env, beneficiary: Address, amount: i128, unlock_ledger: u32) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `beneficiary` | `Address` |
| `amount` | `i128` |
| `unlock_ledger` | `u32` |

#### Return Type

`u32`

### `claim_lock`
Mark a lock as claimed/unlocked.

```rust
pub fn claim_lock(env: Env, beneficiary: Address, lock_id: u32) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `beneficiary` | `Address` |
| `lock_id` | `u32` |

#### Return Type

`i128`

### `get_balance_lock_summary`
Get a summary of all locks for a beneficiary. Returns graceful empty state if no locks exist.

```rust
pub fn get_balance_lock_summary(env: Env, beneficiary: Address) -> BalanceLockSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `beneficiary` | `Address` |

#### Return Type

`BalanceLockSummary`

### `get_unlock_readiness`
Get unlock readiness for a specific lock. Handles missing lock by treating as unlocked/claimed.

```rust
pub fn get_unlock_readiness(env: Env, beneficiary: Address, lock_id: u32) -> UnlockReadinessInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `beneficiary` | `Address` |
| `lock_id` | `u32` |

#### Return Type

`UnlockReadinessInfo`

### `list_locks`
List all lock IDs for a beneficiary (paginated).

```rust
pub fn list_locks(env: Env, beneficiary: Address, start: u32, limit: u32) -> Vec<u32>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `beneficiary` | `Address` |
| `start` | `u32` |
| `limit` | `u32` |

#### Return Type

`Vec<u32>`

