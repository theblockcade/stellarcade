# achievements

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

### `get_category_completion_summary`
```rust
pub fn get_category_completion_summary(env: Env, user: Address, category: String) -> CategoryCompletionSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `category` | `String` |

#### Return Type

`CategoryCompletionSummary`

### `get_next_unlock`
```rust
pub fn get_next_unlock(env: Env, user: Address) -> Option<NextUnlock>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`Option<NextUnlock>`

### `add_achievement`
```rust
pub fn add_achievement(env: Env, user: Address, achievement: Achievement)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `achievement` | `Achievement` |

### `set_next_unlock`
```rust
pub fn set_next_unlock(env: Env, user: Address, unlock: NextUnlock)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `unlock` | `NextUnlock` |

