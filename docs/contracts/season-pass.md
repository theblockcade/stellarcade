# season-pass

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

### `get_entitlement_snapshot`
```rust
pub fn get_entitlement_snapshot(env: Env, user: Address) -> EntitlementSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`EntitlementSnapshot`

### `get_tier_progress`
```rust
pub fn get_tier_progress(env: Env, user: Address) -> Option<TierProgress>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`Option<TierProgress>`

### `add_entitlement`
```rust
pub fn add_entitlement(env: Env, user: Address, entitlement: Entitlement)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `entitlement` | `Entitlement` |

### `set_tier_progress`
```rust
pub fn set_tier_progress(env: Env, user: Address, progress: TierProgress)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `progress` | `TierProgress` |

