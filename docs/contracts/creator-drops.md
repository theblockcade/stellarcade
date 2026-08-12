# creator-drops

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

### `upsert_drop`
Create or update a creator drop while preserving existing claim totals. Supply cannot be reduced below `claimed_supply`, which keeps the saturation accessor monotonic and storage-safe.

```rust
pub fn upsert_drop(env: Env, admin: Address, drop_id: u64, config: DropConfigInput)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `drop_id` | `u64` |
| `config` | `DropConfigInput` |

### `claim`
Claim units from an open creator drop.

```rust
pub fn claim(env: Env, user: Address, drop_id: u64, quantity: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `drop_id` | `u64` |
| `quantity` | `u32` |

### `drop_window_snapshot`
Return a stable drop-window snapshot for `drop_id`.  Before `init` this returns `configured = false`, `state = NotConfigured`, `creator = None`, and zeroed supply fields. Unknown ids after initialization return `exists = false` and `state = Missing`.

```rust
pub fn drop_window_snapshot(env: Env, drop_id: u64) -> DropWindowSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `drop_id` | `u64` |

#### Return Type

`DropWindowSnapshot`

### `drop_allocation_snapshot`
Return the supply allocation split for `drop_id`.  Both `claimed_bps` and `remaining_bps` use floor division in basis points. A missing or unconfigured drop returns zeroed fields with `exists: false`.

```rust
pub fn drop_allocation_snapshot(env: Env, drop_id: u64) -> DropAllocationSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `drop_id` | `u64` |

#### Return Type

`DropAllocationSnapshot`

### `claim_window_accessor`
Return claim-window details for `drop_id`.  The caller supplies `claim_window_secs` — the number of seconds after `ends_at` within which a late claim may still be processed off-chain. The contract does not store this threshold.

```rust
pub fn claim_window_accessor(env: Env, drop_id: u64, claim_window_secs: u64) -> DropClaimWindowAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `drop_id` | `u64` |
| `claim_window_secs` | `u64` |

#### Return Type

`DropClaimWindowAccessor`

### `claim_saturation`
Return a compact claim-saturation view for `drop_id`.  `saturation_bps` uses floor division in basis points: `claimed_supply * 10_000 / total_supply`. Missing and zero-state reads return `saturation_bps = 0`.

```rust
pub fn claim_saturation(env: Env, drop_id: u64) -> ClaimSaturation
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `drop_id` | `u64` |

#### Return Type

`ClaimSaturation`

