# sponsorship-ledger

## Public Methods

### `get_partner_commitment`
Returns the commitment summary for a partner. Handles missing states by returning an empty/default commitment.

```rust
pub fn get_partner_commitment(env: Env, partner: Address) -> PartnerCommitment
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `partner` | `Address` |

#### Return Type

`PartnerCommitment`

### `get_release_schedule`
Returns the release schedule for a partner. Handles missing states by returning an empty schedule.

```rust
pub fn get_release_schedule(env: Env, partner: Address) -> ReleaseSchedule
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `partner` | `Address` |

#### Return Type

`ReleaseSchedule`

### `update_commitment`
Internal/Administrative method to initialize or update a commitment. In a real scenario, this would have access control.

```rust
pub fn update_commitment(env: Env, partner: Address, total_amount: i128, is_active: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `partner` | `Address` |
| `total_amount` | `i128` |
| `is_active` | `bool` |

### `set_paused`
Administrative method to pause/unpause a commitment.

```rust
pub fn set_paused(env: Env, partner: Address, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `partner` | `Address` |
| `paused` | `bool` |

### `set_release_schedule`
Internal/Administrative method to set the release schedule.

```rust
pub fn set_release_schedule(env: Env, partner: Address, releases: Vec<Release>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `partner` | `Address` |
| `releases` | `Vec<Release>` |

### `ledger_balance_summary`
Returns an aggregated balance summary for a partner.  Missing partners return `exists = false` with zeroed amounts.

```rust
pub fn ledger_balance_summary(env: Env, partner: Address) -> LedgerBalanceSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `partner` | `Address` |

#### Return Type

`LedgerBalanceSummary`

### `revocation_window`
Returns the revocation-window state for a partner.  Reports how many releases are pending vs processed and whether the commitment can still be revoked. Missing partners return `exists = false` with zeroed fields.

```rust
pub fn revocation_window(env: Env, partner: Address) -> RevocationWindow
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `partner` | `Address` |

#### Return Type

`RevocationWindow`

