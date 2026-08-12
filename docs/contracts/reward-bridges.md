# reward-bridges

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

### `enqueue`
```rust
pub fn enqueue(env: Env, admin: Address, entries: Vec<BridgeEntry>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `entries` | `Vec<BridgeEntry>` |

### `settle`
```rust
pub fn settle(env: Env, entry_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `entry_id` | `u64` |

### `bridge_queue_summary`
```rust
pub fn bridge_queue_summary(env: Env) -> BridgeQueueSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`BridgeQueueSummary`

### `settlement_gap`
```rust
pub fn settlement_gap(env: Env) -> SettlementGap
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`SettlementGap`

