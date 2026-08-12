# cross-contract-handler

## Public Methods

### `init`
Initialize with admin and optional registry contract. Call once.

```rust
pub fn init(env: Env, admin: Address, registry_contract: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `registry_contract` | `Address` |

#### Return Type

`Result<(), Error>`

### `register_route`
Register a route: source_contract may dispatch to target_contract via selector. Admin only.

```rust
pub fn register_route(env: Env, admin: Address, source_contract: Address, target_contract: Address, selector: Symbol) -> Result<u32, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `source_contract` | `Address` |
| `target_contract` | `Address` |
| `selector` | `Symbol` |

#### Return Type

`Result<u32, Error>`

### `dispatch`
Dispatch a request along a registered route. Caller must be admin or source_contract for that route.

```rust
pub fn dispatch(env: Env, caller: Address, request_id: Symbol, route_id: u32, payload: Bytes) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `caller` | `Address` |
| `request_id` | `Symbol` |
| `route_id` | `u32` |
| `payload` | `Bytes` |

#### Return Type

`Result<(), Error>`

### `acknowledge`
Acknowledge a pending request with a result. Caller must be admin or target_contract for that request's route.

```rust
pub fn acknowledge(env: Env, caller: Address, request_id: Symbol, result: Bytes) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `caller` | `Address` |
| `request_id` | `Symbol` |
| `result` | `Bytes` |

#### Return Type

`Result<(), Error>`

### `get_route`
Return the route for a given route_id, or None if not found.

```rust
pub fn get_route(env: Env, route_id: u32) -> Result<Route, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `route_id` | `u32` |

#### Return Type

`Result<Route, Error>`

### `get_call_status`
Get the status and metadata for a specific call by request_id. Returns a CallSnapshot with request_id, route_id, and current status. This accessor is read-only and does not mutate storage. Returns RequestNotFound error if the call ID does not exist.

```rust
pub fn get_call_status(env: Env, request_id: Symbol) -> Result<CallSnapshot, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `request_id` | `Symbol` |

#### Return Type

`Result<CallSnapshot, Error>`

### `handler_status_snapshot`
Return a snapshot of the handler's configuration state: whether it has been initialized, how many routes are registered, and whether a registry contract is set. This is a read-only accessor and does not mutate storage.

```rust
pub fn handler_status_snapshot(env: Env) -> HandlerStatusSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`HandlerStatusSnapshot`

### `route_timeout_accessor`
Compute timeout metadata for a route given caller-supplied dispatch ledger and timeout window. Returns whether the route exists and whether it has timed out. This is a read-only accessor and does not mutate storage.

```rust
pub fn route_timeout_accessor(env: Env, route_id: u32, dispatched_at: u32, timeout_ledgers: u32) -> RouteTimeoutAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `route_id` | `u32` |
| `dispatched_at` | `u32` |
| `timeout_ledgers` | `u32` |

#### Return Type

`RouteTimeoutAccessor`

### `mark_failed`
Mark a pending request as failed. Caller must be admin or target_contract for that request's route.

```rust
pub fn mark_failed(env: Env, caller: Address, request_id: Symbol, error_info: Bytes) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `caller` | `Address` |
| `request_id` | `Symbol` |
| `error_info` | `Bytes` |

#### Return Type

`Result<(), Error>`

