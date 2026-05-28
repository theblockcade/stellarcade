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

