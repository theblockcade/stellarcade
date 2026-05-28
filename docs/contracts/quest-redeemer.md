# quest-redeemer

## Public Methods

### `init`
Initialize the quest redeemer.

```rust
pub fn init(env: Env, admin: Address, quest_board: Address, token: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `quest_board` | `Address` |
| `token` | `Address` |

#### Return Type

`Result<(), Error>`

### `set_pause`
Set the paused state. Admin only.

```rust
pub fn set_pause(env: Env, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `redeem`
Redeem a quest reward for the caller.

```rust
pub fn redeem(env: Env, user: Address, quest_id: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `quest_id` | `u32` |

#### Return Type

`Result<(), Error>`

### `get_redemption_snapshot`
Returns a complete snapshot of redemption status for a specific user and quest.  # Returns A `RedemptionSnapshot` containing the current status (Eligible, Redeemed, etc.). Handles uninitialized state by returning `None` for config and `Paused` status.

```rust
pub fn get_redemption_snapshot(env: Env, user: Address, quest_id: u32) -> RedemptionSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `quest_id` | `u32` |

#### Return Type

`RedemptionSnapshot`

### `has_redeemed`
Checks if a specific redemption has already occurred.

```rust
pub fn has_redeemed(env: Env, user: Address, quest_id: u32) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `quest_id` | `u32` |

#### Return Type

`bool`

### `is_paused`
Returns whether redemptions are globally paused.

```rust
pub fn is_paused(env: Env) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`bool`

