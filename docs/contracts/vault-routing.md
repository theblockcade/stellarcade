# vault-routing

## Public Methods

### `initialize`
```rust
pub fn initialize(env: Env, admin: Address)
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
pub fn upsert_route(env: Env, admin: Address, route_id: u64, capacity_units: u32, used_units: u32, failover_target_configured: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `route_id` | `u64` |
| `capacity_units` | `u32` |
| `used_units` | `u32` |
| `failover_target_configured` | `bool` |

### `get_route_saturation_summary`
```rust
pub fn get_route_saturation_summary(env: Env) -> RouteSaturationSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RouteSaturationSummary`

### `get_failover_readiness`
```rust
pub fn get_failover_readiness(env: Env, route_id: u64) -> FailoverReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `route_id` | `u64` |

#### Return Type

`FailoverReadiness`

