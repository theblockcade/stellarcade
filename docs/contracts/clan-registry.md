# clan-registry

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

### `roster_summary`
Returns a summary of clan rosters.

```rust
pub fn roster_summary(env: Env) -> RosterSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RosterSummary`

### `pending_invite_snapshot`
Returns a snapshot of pending invites.

```rust
pub fn pending_invite_snapshot(env: Env) -> PendingInviteSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`PendingInviteSnapshot`

