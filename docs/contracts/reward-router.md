# reward-router

## Public Methods

### `init`
Initialize the contract with an admin.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `route_imbalance_summary`
Return the imbalance summary for a specific route. If the route does not exist, returns a zeroed summary.

```rust
pub fn route_imbalance_summary(env: Env, route_id: Symbol) -> RouteImbalanceSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `route_id` | `Symbol` |

#### Return Type

`RouteImbalanceSummary`

### `fallback_bucket`
Return the fallback bucket details. Returns None if fallback is not configured.

```rust
pub fn fallback_bucket(env: Env) -> Option<FallbackBucket>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Option<FallbackBucket>`

### `set_fallback`
Configure the fallback bucket. Admin only.

```rust
pub fn set_fallback(env: Env, admin: Address, bucket_address: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `bucket_address` | `Address` |

### `update_route`
Add or update a route's allocation. Admin only.

```rust
pub fn update_route(env: Env, admin: Address, route_id: Symbol, allocated: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `route_id` | `Symbol` |
| `allocated` | `i128` |

### `split_ratio`
Return the split ratio for a specific route in basis points.  `split_ratio_bps = routed * 10_000 / allocated`, floored to 0 when `allocated == 0` or the route does not exist.

```rust
pub fn split_ratio(env: Env, route_id: Symbol) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `route_id` | `Symbol` |

#### Return Type

`u32`

### `routing_state_snapshot`
Return an aggregate snapshot of routing state across all tracked routes.  `split_ratio_bps` reflects what fraction of total allocated rewards have been routed: `total_routed * 10_000 / total_allocated`. Returns zeroed snapshot before any routes are configured.

```rust
pub fn routing_state_snapshot(env: Env) -> RoutingStateSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RoutingStateSnapshot`

### `route_reward`
Route a reward. Updates routed amount or collects in fallback if route missing.

```rust
pub fn route_reward(env: Env, route_id: Symbol, amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `route_id` | `Symbol` |
| `amount` | `i128` |

