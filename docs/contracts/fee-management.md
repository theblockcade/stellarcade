# fee-management

## Public Methods

### `init`
Initialize the fee management contract  # Arguments * `env` - The contract environment * `admin` - The admin address with full control * `treasury_contract` - The treasury contract address

```rust
pub fn init(env: Env, admin: Address, treasury_contract: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `treasury_contract` | `Address` |

#### Return Type

`Result<(), Error>`

### `set_fee_config`
Set fee configuration for a game

```rust
pub fn set_fee_config(env: Env, admin: Address, game_id: Symbol, bps: u32, recipient: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `game_id` | `Symbol` |
| `bps` | `u32` |
| `recipient` | `Address` |

#### Return Type

`Result<(), Error>`

### `charge_fee`
Charge fee for a game transaction

```rust
pub fn charge_fee(env: Env, game_id: Symbol, amount: i128, token: Option<Address>) -> Result<i128, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `Symbol` |
| `amount` | `i128` |
| `token` | `Option<Address>` |

#### Return Type

`Result<i128, Error>`

### `accrued_fees`
Get accrued fees for a game

```rust
pub fn accrued_fees(env: Env, game_id: Symbol) -> Result<i128, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `Symbol` |

#### Return Type

`Result<i128, Error>`

### `withdraw_fees`
Withdraw accrued fees for a game

```rust
pub fn withdraw_fees(env: Env, admin: Address, game_id: Symbol, recipient: Option<Address>, amount: Option<i128>) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `game_id` | `Symbol` |
| `recipient` | `Option<Address>` |
| `amount` | `Option<i128>` |

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

### `route_allocation_snapshot`
Get route allocation snapshot for a game

```rust
pub fn route_allocation_snapshot(env: Env, game_id: Symbol) -> RouteAllocationSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `Symbol` |

#### Return Type

`RouteAllocationSnapshot`

### `fallback_policy`
Get fallback policy for a game

```rust
pub fn fallback_policy(env: Env, game_id: Symbol) -> FallbackPolicy
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `Symbol` |

#### Return Type

`FallbackPolicy`

