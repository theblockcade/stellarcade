# creator-escrow

## Public Methods

### `init`
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

### `set_paused`
```rust
pub fn set_paused(env: Env, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `configure_creator`
```rust
pub fn configure_creator(env: Env, creator: Address, payout_token: Address, beneficiary: Address, release_delay_ledgers: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `payout_token` | `Address` |
| `beneficiary` | `Address` |
| `release_delay_ledgers` | `u32` |

#### Return Type

`Result<(), Error>`

### `set_creator_paused`
```rust
pub fn set_creator_paused(env: Env, creator: Address, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `fund_escrow`
```rust
pub fn fund_escrow(env: Env, creator: Address, amount: i128) -> Result<u64, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<u64, Error>`

### `release_available`
```rust
pub fn release_available(env: Env, creator: Address) -> Result<i128, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |

#### Return Type

`Result<i128, Error>`

### `creator_summary`
```rust
pub fn creator_summary(env: Env, creator: Address) -> CreatorEscrowSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |

#### Return Type

`CreatorEscrowSummary`

### `escrow_entry`
```rust
pub fn escrow_entry(env: Env, creator: Address, entry_id: u64) -> CreatorEscrowEntryView
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `creator` | `Address` |
| `entry_id` | `u64` |

#### Return Type

`CreatorEscrowEntryView`

