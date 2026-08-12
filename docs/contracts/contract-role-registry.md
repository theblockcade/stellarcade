# contract-role-registry

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

### `assign_role`
```rust
pub fn assign_role(env: Env, target: Address, role: Symbol)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target` | `Address` |
| `role` | `Symbol` |

### `revoke_role`
```rust
pub fn revoke_role(env: Env, target: Address, role: Symbol)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target` | `Address` |
| `role` | `Symbol` |

### `has_role`
```rust
pub fn has_role(env: Env, target: Address, role: Symbol) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target` | `Address` |
| `role` | `Symbol` |

#### Return Type

`bool`

### `get_admin`
```rust
pub fn get_admin(env: Env) -> Address
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Address`

### `bulk_assign_role`
```rust
pub fn bulk_assign_role(env: Env, assignments: Vec<(Address, Symbol)>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `assignments` | `Vec<(Address` |

### `bulk_revoke_role`
```rust
pub fn bulk_revoke_role(env: Env, revocations: Vec<(Address, Symbol)>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `revocations` | `Vec<(Address` |

### `is_initialized`
```rust
pub fn is_initialized(env: Env) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`bool`

### `admin_view`
```rust
pub fn admin_view(env: Env) -> AdminView
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`AdminView`

### `role_status`
```rust
pub fn role_status(env: Env, target: Address, role: Symbol) -> RoleStatus
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target` | `Address` |
| `role` | `Symbol` |

#### Return Type

`RoleStatus`

### `get_roles_of`
```rust
pub fn get_roles_of(env: Env, target: Address) -> Vec<Symbol>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target` | `Address` |

#### Return Type

`Vec<Symbol>`

### `list_targets_with_role`
```rust
pub fn list_targets_with_role(env: Env, role: Symbol) -> Vec<Address>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `role` | `Symbol` |

#### Return Type

`Vec<Address>`

### `target_role_count`
```rust
pub fn target_role_count(env: Env, target: Address) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `target` | `Address` |

#### Return Type

`u32`

### `role_target_count`
```rust
pub fn role_target_count(env: Env, role: Symbol) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `role` | `Symbol` |

#### Return Type

`u32`

