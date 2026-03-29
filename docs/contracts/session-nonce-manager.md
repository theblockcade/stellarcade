# session-nonce-manager

## Public Methods

### `init`
Initialise the contract and set the admin. Must be called exactly once.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `issue_nonce`
Issue the next nonce for `(account, purpose)` and return its value.

```rust
pub fn issue_nonce(env: Env, account: Address, purpose: String) -> u64
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `account` | `Address` |
| `purpose` | `String` |

#### Return Type

`u64`

### `consume_nonce`
Consume `nonce` for `(account, purpose)`, marking it as used.

```rust
pub fn consume_nonce(env: Env, account: Address, nonce: u64, purpose: String)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `account` | `Address` |
| `nonce` | `u64` |
| `purpose` | `String` |

### `is_nonce_valid`
Return `true` if `nonce` for `(account, purpose)` is still active.

```rust
pub fn is_nonce_valid(env: Env, account: Address, nonce: u64, purpose: String) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `account` | `Address` |
| `nonce` | `u64` |
| `purpose` | `String` |

#### Return Type

`bool`

### `nonce_status`
Return lifecycle and TTL metadata for `(account, purpose, nonce)`. The returned status distinguishes active, consumed, revoked, expired, and missing nonces.

```rust
pub fn nonce_status(env: Env, account: Address, nonce: u64, purpose: String) -> NonceStatus
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `account` | `Address` |
| `nonce` | `u64` |
| `purpose` | `String` |

#### Return Type

`NonceStatus`

### `revoke_nonce`
Revoke `nonce` for `(account, purpose)`. Only the admin may revoke nonces.

```rust
pub fn revoke_nonce(env: Env, account: Address, purpose: String, nonce: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `account` | `Address` |
| `purpose` | `String` |
| `nonce` | `u64` |

