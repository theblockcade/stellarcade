# combo-rewards

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

### `set_paused`
```rust
pub fn set_paused(env: Env, admin: Address, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `paused` | `bool` |

### `upsert_player_snapshot`
```rust
pub fn upsert_player_snapshot(env: Env, admin: Address, player: Address, streak_count: u32, combo_multiplier_bps: u32, expires_at_ledger: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `player` | `Address` |
| `streak_count` | `u32` |
| `combo_multiplier_bps` | `u32` |
| `expires_at_ledger` | `u32` |

### `get_streak_combo_snapshot`
```rust
pub fn get_streak_combo_snapshot(env: Env, player: Address) -> StreakComboSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |

#### Return Type

`StreakComboSnapshot`

### `get_expiry_risk_accessor`
```rust
pub fn get_expiry_risk_accessor(env: Env, player: Address) -> ExpiryRiskAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `player` | `Address` |

#### Return Type

`ExpiryRiskAccessor`

