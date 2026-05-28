# prize-router-v2

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

### `set_delay`
```rust
pub fn set_delay(env: Env, admin: Address, delay_ledgers: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `delay_ledgers` | `u32` |

#### Return Type

`Result<(), Error>`

### `set_pressure_threshold`
```rust
pub fn set_pressure_threshold(env: Env, admin: Address, threshold: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `threshold` | `u32` |

#### Return Type

`Result<(), Error>`

### `set_paused`
```rust
pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `enqueue_payout`
Enqueue a payout into the delay queue.

```rust
pub fn enqueue_payout(env: Env, admin: Address, recipient: Address, amount: i128) -> Result<u32, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `recipient` | `Address` |
| `amount` | `i128` |

#### Return Type

`Result<u32, Error>`

### `release_payout`
Release a releasable payout by index (removes it from the queue).

```rust
pub fn release_payout(env: Env, admin: Address, index: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `index` | `u32` |

#### Return Type

`Result<(), Error>`

### `route_pressure_summary`
Return a route pressure summary for the current queue state.  Zero-state (empty queue): all counts/amounts 0, `overloaded` false.

```rust
pub fn route_pressure_summary(env: Env) -> RoutePressureSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RoutePressureSummary`

### `payout_delay`
Return delay information for a specific payout by queue index.  Zero-state: `found` false when index is out of range.

```rust
pub fn payout_delay(env: Env, index: u32) -> PayoutDelayInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `index` | `u32` |

#### Return Type

`PayoutDelayInfo`

### `queue_length`
Return the current queue length.

```rust
pub fn queue_length(env: Env) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`u32`

