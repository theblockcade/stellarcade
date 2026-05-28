# loot-crate

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

### `upsert_crate`
```rust
pub fn upsert_crate(env: Env, admin: Address, crate_id: u64, total_supply: u32, minted_supply: u32, paused: bool, common_count: u32, rare_count: u32, epic_count: u32, legendary_count: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `crate_id` | `u64` |
| `total_supply` | `u32` |
| `minted_supply` | `u32` |
| `paused` | `bool` |
| `common_count` | `u32` |
| `rare_count` | `u32` |
| `epic_count` | `u32` |
| `legendary_count` | `u32` |

### `crate_availability_snapshot`
```rust
pub fn crate_availability_snapshot(env: Env, crate_id: u64) -> CrateAvailabilitySnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `crate_id` | `u64` |

#### Return Type

`CrateAvailabilitySnapshot`

### `rarity_distribution_snapshot`
Returns rarity percentages in basis points with floor division. Missing crates and empty rarity configs return zeroed values.

```rust
pub fn rarity_distribution_snapshot(env: Env, crate_id: u64) -> RarityDistributionSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `crate_id` | `u64` |

#### Return Type

`RarityDistributionSnapshot`

