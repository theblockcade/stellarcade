# revenue-split

Per-beneficiary share calculation returned by `preview_shares`.

## Public Methods

### `init`
Initialize with admin and the token used for splits.

```rust
pub fn init(env: Env, admin: Address, token_address: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `token_address` | `Address` |

### `set_split_config`
Configure or update a split for a stream. Admin-only. Recipient weights must sum to exactly 10000 BPS.

```rust
pub fn set_split_config(env: Env, stream_id: Symbol, recipients: Vec<RecipientWeight>)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `stream_id` | `Symbol` |
| `recipients` | `Vec<RecipientWeight>` |

### `deposit_revenue`
Deposit revenue into a stream. Any caller may deposit; they must auth.

```rust
pub fn deposit_revenue(env: Env, depositor: Address, stream_id: Symbol, amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `depositor` | `Address` |
| `stream_id` | `Symbol` |
| `amount` | `i128` |

### `distribute`
Distribute all pending revenue in a stream to recipients. Admin-only.

```rust
pub fn distribute(env: Env, stream_id: Symbol)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `stream_id` | `Symbol` |

### `recipient_balance`
Query cumulative amount distributed to a recipient for a stream.

```rust
pub fn recipient_balance(env: Env, stream_id: Symbol, recipient: Address) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `stream_id` | `Symbol` |
| `recipient` | `Address` |

#### Return Type

`i128`

### `preview_shares`
Preview how a prospective amount would be split for a configured stream. The preview uses the exact same rounding logic as `distribute`.

```rust
pub fn preview_shares(env: Env, stream_id: Symbol, amount: i128) -> SharePreview
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `stream_id` | `Symbol` |
| `amount` | `i128` |

#### Return Type

`SharePreview`

### `get_split_state`
Return a deterministic snapshot of current pending balance and cumulative beneficiary accruals for the stream.

```rust
pub fn get_split_state(env: Env, stream_id: Symbol) -> SplitAccrualSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `stream_id` | `Symbol` |

#### Return Type

`SplitAccrualSnapshot`

