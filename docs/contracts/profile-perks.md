# profile-perks

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

### `active_perk_summary`
Returns the currently active perk summary for a user profile.  Empty/missing behavior: - Not-yet-configured catalogs return `configured = false` with zero-value fields. - Unknown users default to `points = 0`.

```rust
pub fn active_perk_summary(env: Env, user: Address) -> ActivePerkSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`ActivePerkSummary`

### `unlock_gap`
Returns unlock-gap info for the next perk in the active catalog.  Zero-value conventions: - Not-yet-configured catalogs return `configured = false`. - If all perks are unlocked, `points_to_unlock = 0` and `all_perks_unlocked = true`.

```rust
pub fn unlock_gap(env: Env, user: Address) -> UnlockGapSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`UnlockGapSnapshot`

