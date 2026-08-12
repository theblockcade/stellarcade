# quest-ledger-v2

## Public Methods

### `init`
Initialize the contract with admin

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

### `pause`
Pause the contract (admin only)

```rust
pub fn pause(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `unpause`
Unpause the contract (admin only)

```rust
pub fn unpause(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `complete_quest`
Record quest completion

```rust
pub fn complete_quest(env: Env, player: Address, quest_id: u64, reward_amount: i128, reward_token: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `quest_id` | `u64` |
| `reward_amount` | `i128` |
| `reward_token` | `Address` |

#### Return Type

`Result<(), Error>`

### `set_reward_delay`
Set reward delay for a quest

```rust
pub fn set_reward_delay(env: Env, admin: Address, quest_id: u64, delay_seconds: u64, reason: Symbol) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `quest_id` | `u64` |
| `delay_seconds` | `u64` |
| `reason` | `Symbol` |

#### Return Type

`Result<(), Error>`

### `get_completion_queue_snapshot`
Get completion queue snapshot

```rust
pub fn get_completion_queue_snapshot(env: Env) -> Result<CompletionQueueSnapshot, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Result<CompletionQueueSnapshot, Error>`

### `get_reward_delay_accessor`
Get reward delay accessor for a quest

```rust
pub fn get_reward_delay_accessor(env: Env, quest_id: u64) -> Result<RewardDelayAccessor, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `quest_id` | `u64` |

#### Return Type

`Result<RewardDelayAccessor, Error>`

### `get_quest_completion`
Get quest completion details

```rust
pub fn get_quest_completion(env: Env, quest_id: u64) -> Result<QuestCompletion, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `quest_id` | `u64` |

#### Return Type

`Result<QuestCompletion, Error>`

### `update_completion_status`
Update completion status

```rust
pub fn update_completion_status(env: Env, admin: Address, quest_id: u64, new_status: Symbol) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `quest_id` | `u64` |
| `new_status` | `Symbol` |

#### Return Type

`Result<(), Error>`

### `get_queue_metrics`
Get queue metrics

```rust
pub fn get_queue_metrics(env: Env) -> Result<QueueMetrics, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Result<QueueMetrics, Error>`

