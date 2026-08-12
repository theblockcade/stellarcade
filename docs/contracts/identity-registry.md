# identity-registry

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

### `register_identity`
```rust
pub fn register_identity(env: Env, identity: Address, display_name: Option<String>, country_code: Option<String>, bio: Option<String>, avatar_uri: Option<String>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `identity` | `Address` |
| `display_name` | `Option<String>` |
| `country_code` | `Option<String>` |
| `bio` | `Option<String>` |
| `avatar_uri` | `Option<String>` |

### `set_verification_state`
```rust
pub fn set_verification_state(env: Env, identity: Address, email_verified: bool, phone_verified: bool, government_id_verified: bool, wallet_linked: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `identity` | `Address` |
| `email_verified` | `bool` |
| `phone_verified` | `bool` |
| `government_id_verified` | `bool` |
| `wallet_linked` | `bool` |

### `profile_completeness`
```rust
pub fn profile_completeness(env: Env, identity: Address) -> ProfileCompleteness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `identity` | `Address` |

#### Return Type

`ProfileCompleteness`

### `verification_summary`
```rust
pub fn verification_summary(env: Env, identity: Address) -> VerificationSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `identity` | `Address` |

#### Return Type

`VerificationSummary`

### `status_verification_snapshot`
Point-in-time snapshot of an identity's verification status.  Returns zeroed fields with `exists: false` when the identity is unknown.

```rust
pub fn status_verification_snapshot(env: Env, identity: Address) -> StatusVerificationSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `identity` | `Address` |

#### Return Type

`StatusVerificationSnapshot`

### `renewal_window_accessor`
Renewal-window details for a single identity.  The caller supplies `expires_at_ledger` and `renewal_window_ledgers`. Neither value is stored by the contract — the caller controls the expiry policy.

```rust
pub fn renewal_window_accessor(env: Env, identity: Address, expires_at_ledger: u32, renewal_window_ledgers: u32) -> RenewalWindowAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `identity` | `Address` |
| `expires_at_ledger` | `u32` |
| `renewal_window_ledgers` | `u32` |

#### Return Type

`RenewalWindowAccessor`

