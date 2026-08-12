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

### `get_achievement_unlock_snapshot`
```rust
pub fn get_achievement_unlock_snapshot(env: Env, user: Address) -> AchievementUnlockSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`AchievementUnlockSnapshot`

### `get_claim_grace_accessor`
```rust
pub fn get_claim_grace_accessor(env: Env, user: Address) -> ClaimGraceAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`ClaimGraceAccessor`

### `set_claim_grace_period`
```rust
pub fn set_claim_grace_period(env: Env, user: Address, grace_ledger: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `grace_ledger` | `u32` |

