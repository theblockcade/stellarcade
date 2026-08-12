# wallet-reserves

## Public Methods

### `init`
Initialize the contract with admin

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

### `pause`
Pause the contract (admin only)

```rust
pub fn pause(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `unpause`
Unpause the contract (admin only)

```rust
pub fn unpause(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `allocate_reserves`
Allocate reserves to a wallet

```rust
pub fn allocate_reserves(env: Env, admin: Address, wallet: Address, amount: i128, depletion_threshold: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `wallet` | `Address` |
| `amount` | `i128` |
| `depletion_threshold` | `i128` |

#### Return Type

`Result<(), Error>`

### `update_available_reserves`
Update available reserves for a wallet

```rust
pub fn update_available_reserves(env: Env, admin: Address, wallet: Address, new_available: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `wallet` | `Address` |
| `new_available` | `i128` |

#### Return Type

`Result<(), Error>`

### `get_reserve_allocation_summary`
Get reserve allocation summary

```rust
pub fn get_reserve_allocation_summary(env: Env) -> Result<ReserveAllocationSummary, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Result<ReserveAllocationSummary, Error>`

### `get_depletion_risk_assessment`
Get depletion risk assessment for a specific wallet

```rust
pub fn get_depletion_risk_assessment(env: Env, wallet: Address) -> Result<DepletionRiskAssessment, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `wallet` | `Address` |

#### Return Type

`Result<DepletionRiskAssessment, Error>`

### `get_wallet_reserves`
Get wallet reserve allocation

```rust
pub fn get_wallet_reserves(env: Env, wallet: Address) -> Result<ReserveAllocation, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `wallet` | `Address` |

#### Return Type

`Result<ReserveAllocation, Error>`

