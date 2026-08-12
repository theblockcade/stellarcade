# player-stamps

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

### `upsert_campaign`
```rust
pub fn upsert_campaign(env: Env, admin: Address, campaign_id: u32, required_stamps: u32, claimable_after: u64, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `campaign_id` | `u32` |
| `required_stamps` | `u32` |
| `claimable_after` | `u64` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `add_stamps`
```rust
pub fn add_stamps(env: Env, admin: Address, player: Address, campaign_id: u32, amount: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `player` | `Address` |
| `campaign_id` | `u32` |
| `amount` | `u32` |

#### Return Type

`Result<(), Error>`

### `claim`
```rust
pub fn claim(env: Env, player: Address, campaign_id: u32) -> Result<PlayerStampProgress, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `campaign_id` | `u32` |

#### Return Type

`Result<PlayerStampProgress, Error>`

### `stamp_progress_summary`
```rust
pub fn stamp_progress_summary(env: Env, player: Address, campaign_id: u32) -> StampProgressSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `campaign_id` | `u32` |

#### Return Type

`StampProgressSummary`

### `claim_window_accessor`
```rust
pub fn claim_window_accessor(env: Env, player: Address, campaign_id: u32) -> ClaimWindowAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |
| `campaign_id` | `u32` |

#### Return Type

`ClaimWindowAccessor`

