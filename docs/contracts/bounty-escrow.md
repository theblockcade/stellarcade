# bounty-escrow

## Public Methods

### `init`
Initialize the contract. Panics if already initialized.

```rust
pub fn init(env: Env, admin: Address, token: Address, fee_bps: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `token` | `Address` |
| `fee_bps` | `u32` |

### `post_bounty`
Post a new bounty. Validates inputs, assigns an ID, and writes to storage.

```rust
pub fn post_bounty(env: Env, poster: Address, reward: i128, expiry_ledger: u32, description: Symbol) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `poster` | `Address` |
| `reward` | `i128` |
| `expiry_ledger` | `u32` |
| `description` | `Symbol` |

#### Return Type

`u64`

### `update_bounty_status`
Update the status of an existing bounty. Admin-only.

```rust
pub fn update_bounty_status(env: Env, admin: Address, bounty_id: u64, new_status: BountyStatus)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `bounty_id` | `u64` |
| `new_status` | `BountyStatus` |

### `get_bounty`
Return the full state of a single bounty. No auth required. Returns a zero-state `BountyView` (exists: false) when the ID is unknown.

```rust
pub fn get_bounty(env: Env, bounty_id: u64) -> BountyView
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bounty_id` | `u64` |

#### Return Type

`BountyView`

### `get_bounties_by_poster`
Return all bounties posted by `poster`. No auth required. Returns an empty vec when the poster has no bounties.

```rust
pub fn get_bounties_by_poster(env: Env, poster: Address) -> Vec<BountyView>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `poster` | `Address` |

#### Return Type

`Vec<BountyView>`

### `get_bounty_status`
Return the status of a single bounty. No auth required. Returns a zero-state `BountyStatusView` (exists: false) when the ID is unknown.

```rust
pub fn get_bounty_status(env: Env, bounty_id: u64) -> BountyStatusView
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bounty_id` | `u64` |

#### Return Type

`BountyStatusView`

### `get_platform_config`
Return the current platform configuration. No auth required. Returns `initialized: false` when the contract has not been initialized.

```rust
pub fn get_platform_config(env: Env) -> PlatformConfigView
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`PlatformConfigView`

### `get_bounty_summary`
Return aggregate statistics across all bounties. No auth required. Returns an all-zero `BountySummary` when no bounties exist.

```rust
pub fn get_bounty_summary(env: Env) -> BountySummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`BountySummary`

