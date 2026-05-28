# governance-token

A single voting-weight snapshot recorded at a given ledger sequence.

## Public Methods

### `init`
Initializes the contract with the admin address and token setup. Requires admin authorization to prevent arbitrary initialization.

```rust
pub fn init(env: Env, admin: Address, name: String, symbol: String, decimals: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `name` | `String` |
| `symbol` | `String` |
| `decimals` | `u32` |

#### Return Type

`Result<(), Error>`

### `mint`
Mints new tokens to a recipient. Only admin can call.

```rust
pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `to` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `burn`
Burns tokens from an account. Only admin can call.

```rust
pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `from` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `transfer`
Transfers tokens between accounts. Requires sender authorization.

```rust
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `from` | `Address` |
| `to` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `balance`
```rust
pub fn balance(env: Env, id: Address) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `Address` |

#### Return Type

`i128`

### `total_supply`
```rust
pub fn total_supply(env: Env) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`i128`

### `name`
```rust
pub fn name(env: Env) -> String
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`String`

### `symbol`
```rust
pub fn symbol(env: Env) -> String
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`String`

### `decimals`
```rust
pub fn decimals(env: Env) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`u32`

### `latest_checkpoint`
Returns the most recent checkpoint for `holder`. Returns `None` when the holder has no recorded history.

```rust
pub fn latest_checkpoint(env: Env, holder: Address) -> Option<Checkpoint>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `holder` | `Address` |

#### Return Type

`Option<Checkpoint>`

### `checkpoint_history`
Returns up to `limit` most-recent checkpoints for `holder`, ordered oldest-first within the returned slice.  `limit` is capped at `MAX_CHECKPOINTS`.  Returns an empty vec for unknown holders.

```rust
pub fn checkpoint_history(env: Env, holder: Address, limit: u32) -> Vec<Checkpoint>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `holder` | `Address` |
| `limit` | `u32` |

#### Return Type

`Vec<Checkpoint>`

### `checkpoint_at_ledger`
Returns the most recent checkpoint at or before `ledger` for `holder`. Enables snapshot-based vote weighting: callers pass a proposal's `start_ledger` to get the holder's balance at that point in time. Returns `None` for unknown holders or if no checkpoint precedes `ledger`.

```rust
pub fn checkpoint_at_ledger(env: Env, holder: Address, ledger: u32) -> Option<Checkpoint>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `holder` | `Address` |
| `ledger` | `u32` |

#### Return Type

`Option<Checkpoint>`

