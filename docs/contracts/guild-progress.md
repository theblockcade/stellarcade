# guild-progress

## Public Methods

### `init`
Initialize the contract with a super admin. Can only be called once.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `get_admin`
Get the current admin.

```rust
pub fn get_admin(env: Env) -> Address
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Address`

### `create_milestone`
Create a new milestone for a guild.

```rust
pub fn create_milestone(env: Env, guild_id: Address, target_progress: i128, reward_amount: i128) -> u32
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `guild_id` | `Address` |
| `target_progress` | `i128` |
| `reward_amount` | `i128` |

#### Return Type

`u32`

### `update_progress`
Update guild progress and check for milestone completions.

```rust
pub fn update_progress(env: Env, guild_id: Address, new_progress: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `guild_id` | `Address` |
| `new_progress` | `i128` |

### `get_current_progress`
Get the current progress for a guild.

```rust
pub fn get_current_progress(env: Env, guild_id: Address) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `guild_id` | `Address` |

#### Return Type

`i128`

### `get_milestone_coverage_snapshot`
Get a snapshot of milestone coverage for a guild. Returns graceful zero-state if guild unknown.

```rust
pub fn get_milestone_coverage_snapshot(env: Env, guild_id: Address) -> MilestoneCoverageSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `guild_id` | `Address` |

#### Return Type

`MilestoneCoverageSnapshot`

### `get_next_milestone_target`
Get the next uncompleted milestone target. Returns zero/completion state if all milestones done.

```rust
pub fn get_next_milestone_target(env: Env, guild_id: Address) -> NextMilestoneTarget
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `guild_id` | `Address` |

#### Return Type

`NextMilestoneTarget`

### `list_milestones`
List all milestone IDs for a guild (paginated).

```rust
pub fn list_milestones(env: Env, guild_id: Address, start: u32, limit: u32) -> Vec<u32>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `guild_id` | `Address` |
| `start` | `u32` |
| `limit` | `u32` |

#### Return Type

`Vec<u32>`

### `get_milestone_details`
Get details of a specific milestone.

```rust
pub fn get_milestone_details(env: Env, guild_id: Address, milestone_id: u32) -> Milestone
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `guild_id` | `Address` |
| `milestone_id` | `u32` |

#### Return Type

`Milestone`

