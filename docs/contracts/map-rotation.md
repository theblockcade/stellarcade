# map-rotation

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

### `active_map_cycle_snapshot`
Returns a snapshot of the current active map cycle.

```rust
pub fn active_map_cycle_snapshot(env: Env) -> ActiveMapCycleSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ActiveMapCycleSnapshot`

### `next_rotation`
Returns details about the next map rotation.

```rust
pub fn next_rotation(env: Env) -> NextRotation
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`NextRotation`

