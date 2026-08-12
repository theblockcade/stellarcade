# lending-pool

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address, liquidation_buffer_bps: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `liquidation_buffer_bps` | `u32` |

### `set_pool_totals`
```rust
pub fn set_pool_totals(env: Env, admin: Address, total_supplied: i128, total_borrowed: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `total_supplied` | `i128` |
| `total_borrowed` | `i128` |

### `set_liquidation_buffer`
```rust
pub fn set_liquidation_buffer(env: Env, admin: Address, liquidation_buffer_bps: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `liquidation_buffer_bps` | `u32` |

### `utilization_snapshot`
Uses basis points with floor division (`borrowed * 10_000 / supplied`). Returns zeroed fields when the pool is not initialized or has no tracked totals yet.

```rust
pub fn utilization_snapshot(env: Env) -> UtilizationSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`UtilizationSnapshot`

### `pool_utilization_snapshot`
Named pool-utilization snapshot extending `utilization_snapshot` with a `healthy` flag comparing utilization to the liquidation buffer threshold.

```rust
pub fn pool_utilization_snapshot(env: Env) -> PoolUtilizationSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`PoolUtilizationSnapshot`

### `interest_cooldown_accessor`
Returns an interest-cooldown accessor.  Callers supply `last_accrued_at` and `cooldown_seconds`. `ready` is true when `now >= last_accrued_at + cooldown_seconds`. Zero disables cooldown.

```rust
pub fn interest_cooldown_accessor(env: Env, last_accrued_at: u64, cooldown_seconds: u64) -> InterestCooldownAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `last_accrued_at` | `u64` |
| `cooldown_seconds` | `u64` |

#### Return Type

`InterestCooldownAccessor`

### `liquidation_buffer_snapshot`
```rust
pub fn liquidation_buffer_snapshot(env: Env) -> LiquidationBufferSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`LiquidationBufferSnapshot`

