# squad-roster

## Public Methods

### `init`
Initialise the contract with an admin address.

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

### `add_slot`
Add a role slot to the roster.

```rust
pub fn add_slot(env: Env, admin: Address, role: Symbol) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `role` | `Symbol` |

#### Return Type

`Result<(), Error>`

### `assign_player`
Assign a player to a role slot.

```rust
pub fn assign_player(env: Env, admin: Address, role: Symbol, player: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `role` | `Symbol` |
| `player` | `Address` |

#### Return Type

`Result<(), Error>`

### `remove_player`
Remove a player from a role slot, leaving it vacant.

```rust
pub fn remove_player(env: Env, admin: Address, role: Symbol) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `role` | `Symbol` |

#### Return Type

`Result<(), Error>`

### `set_lock`
Lock or unlock a role slot.

```rust
pub fn set_lock(env: Env, admin: Address, role: Symbol, locked: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `role` | `Symbol` |
| `locked` | `bool` |

#### Return Type

`Result<(), Error>`

### `set_paused`
Pause or unpause the contract.

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

### `lineup_readiness_summary`
Return a summary of lineup readiness.  Zero-state (no slots registered): all counts 0, `ready` false. The lineup is `ready` only when every slot is filled and none are locked.

```rust
pub fn lineup_readiness_summary(env: Env) -> LineupReadinessSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`LineupReadinessSummary`

### `vacancy_for_role`
Return vacancy information for a specific role.  Zero-state: `exists` false when the role has no registered slot.

```rust
pub fn vacancy_for_role(env: Env, role: Symbol) -> RoleVacancy
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `role` | `Symbol` |

#### Return Type

`RoleVacancy`

### `get_roles`
Return all registered role names.

```rust
pub fn get_roles(env: Env) -> Vec<Symbol>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Vec<Symbol>`

