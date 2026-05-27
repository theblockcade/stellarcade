# vault-claims

## Public Methods

### `init`
Initialise the vault with an admin who can register / cancel claims.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `register_claim`
Register a new outstanding claim against the vault.

```rust
pub fn register_claim(env: Env, admin: Address, claim_id: u64, beneficiary: Address, token: Address, amount: i128, release_after: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `claim_id` | `u64` |
| `beneficiary` | `Address` |
| `token` | `Address` |
| `amount` | `i128` |
| `release_after` | `u64` |

### `release`
Release an outstanding claim once its window has opened.

```rust
pub fn release(env: Env, beneficiary: Address, claim_id: u64) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `beneficiary` | `Address` |
| `claim_id` | `u64` |

#### Return Type

`i128`

### `cancel`
Cancel an outstanding claim. Only allowed before release.

```rust
pub fn cancel(env: Env, admin: Address, claim_id: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `claim_id` | `u64` |

### `outstanding_claim_summary`
Aggregate snapshot of every outstanding / released / cancelled claim.

```rust
pub fn outstanding_claim_summary(env: Env) -> OutstandingClaimSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`OutstandingClaimSummary`

### `release_window`
Window snapshot for a single claim — collapses to the documented fallback when the id is unknown or the vault is unconfigured so frontend consumers can render without a separate lookup.

```rust
pub fn release_window(env: Env, claim_id: u64) -> ReleaseWindow
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `claim_id` | `u64` |

#### Return Type

`ReleaseWindow`

