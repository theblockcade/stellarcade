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

