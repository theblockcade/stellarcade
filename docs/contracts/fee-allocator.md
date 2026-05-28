# fee-allocator

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

### `set_paused`
```rust
pub fn set_paused(env: Env, admin: Address, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `paused` | `bool` |

### `upsert_route`
```rust
pub fn upsert_route(env: Env, admin: Address, route_id: Symbol, target_bps: u32, allocated_amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `route_id` | `Symbol` |
| `target_bps` | `u32` |
| `allocated_amount` | `i128` |

### `allocation_drift_summary`
Returns a structured drift summary for every allocation route.  Expected amounts use floor division: `(total_allocated * target_bps) / 10000`. Missing and empty states return an empty route list and zero totals.

```rust
pub fn allocation_drift_summary(env: Env) -> AllocationDriftSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`AllocationDriftSummary`

### `rebalance_readiness`
Returns whether current allocations can be rebalanced.  Rebalancing is ready only when the allocator is configured, unpaused, target bps sum to 10000, at least one route has funds, and drift is greater than the rounding threshold.

```rust
pub fn rebalance_readiness(env: Env) -> RebalanceReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RebalanceReadiness`

