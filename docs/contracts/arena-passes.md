# arena-passes

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

### `issue_passes`
```rust
pub fn issue_passes(env: Env, admin: Address, holders: Vec<PassHolder>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `holders` | `Vec<PassHolder>` |

### `use_pass`
```rust
pub fn use_pass(env: Env, holder_index: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `holder_index` | `u32` |

### `holder_usage_snapshot`
```rust
pub fn holder_usage_snapshot(env: Env) -> HolderUsageSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`HolderUsageSnapshot`

### `renewal_window`
```rust
pub fn renewal_window(env: Env, holder_index: u32) -> RenewalWindow
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `holder_index` | `u32` |

#### Return Type

`RenewalWindow`

