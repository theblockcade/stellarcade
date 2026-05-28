# ticket-redeemer

## Public Methods

### `init`
Initialize the ticket redeemer.

```rust
pub fn init(env: Env, admin: Address, token: Address, queue_capacity: u32, scan_window_size: u32) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `token` | `Address` |
| `queue_capacity` | `u32` |
| `scan_window_size` | `u32` |

#### Return Type

`Result<(), Error>`

### `set_pause`
Set the paused state. Admin only.

```rust
pub fn set_pause(env: Env, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `submit_ticket`
Submit a ticket to the redemption queue.

```rust
pub fn submit_ticket(env: Env, owner: Address, _ticket_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `owner` | `Address` |
| `_ticket_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `redeem_ticket`
Mark a ticket as redeemed.

```rust
pub fn redeem_ticket(env: Env, owner: Address, ticket_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `owner` | `Address` |
| `ticket_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `cancel_ticket`
Cancel a ticket. Admin only.

```rust
pub fn cancel_ticket(env: Env, admin: Address, ticket_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `ticket_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `start_scan_window`
Start a scan window. Admin only.

```rust
pub fn start_scan_window(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `close_scan_window`
Close the current scan window. Admin only.

```rust
pub fn close_scan_window(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `get_queue_snapshot`
Returns an aggregate snapshot of the redemption queue state.  Handles uninitialized contract by returning zero-state with `config_initialized: false`.

```rust
pub fn get_queue_snapshot(env: Env) -> QueueSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`QueueSnapshot`

### `get_queue_entry`
Returns a single queue entry view for the given ticket ID.  If the ticket does not exist, returns a view with `exists: false` and all fields `None`.

```rust
pub fn get_queue_entry(env: Env, ticket_id: u64) -> QueueEntryView
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `ticket_id` | `u64` |

#### Return Type

`QueueEntryView`

### `get_scan_window`
Returns the current scan window state, or None if no window exists.

```rust
pub fn get_scan_window(env: Env) -> Option<ScanWindow>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Option<ScanWindow>`

### `get_queue_entries`
Returns a paginated list of queue entry views.  Returns empty views for any IDs that don't have stored entries.

```rust
pub fn get_queue_entries(env: Env, offset: u32, limit: u32) -> Vec<QueueEntryView>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `offset` | `u32` |
| `limit` | `u32` |

#### Return Type

`Vec<QueueEntryView>`

### `is_paused`
Returns whether the contract is paused.

```rust
pub fn is_paused(env: Env) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`bool`

