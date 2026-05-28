# quest-board

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

### `get_quest_availability_summary`
```rust
pub fn get_quest_availability_summary(env: Env) -> QuestAvailabilitySummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`QuestAvailabilitySummary`

### `get_reward_budget`
```rust
pub fn get_reward_budget(env: Env) -> RewardBudget
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RewardBudget`

### `add_quest`
```rust
pub fn add_quest(env: Env, quest: Quest)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `quest` | `Quest` |

### `set_budget`
```rust
pub fn set_budget(env: Env, total: i128, allocated: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `total` | `i128` |
| `allocated` | `i128` |

