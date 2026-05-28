# oracle-integration

Snapshot of the configured oracle source addresses at read time. Returns `None` from `source_config_snapshot` when the contract has not been initialized.

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address, oracle_sources_config: Vec<Address>) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `oracle_sources_config` | `Vec<Address>` |

#### Return Type

`Result<(), Error>`

### `request_data`
```rust
pub fn request_data(env: Env, caller: Address, feed_id: BytesN<32>, request_id: BytesN<32>) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `caller` | `Address` |
| `feed_id` | `BytesN<32>` |
| `request_id` | `BytesN<32>` |

#### Return Type

`Result<(), Error>`

### `fulfill_data`
```rust
pub fn fulfill_data(env: Env, caller: Address, request_id: BytesN<32>, payload: Bytes, _proof: Bytes) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `caller` | `Address` |
| `request_id` | `BytesN<32>` |
| `payload` | `Bytes` |
| `_proof` | `Bytes` |

#### Return Type

`Result<(), Error>`

### `latest`
```rust
pub fn latest(env: Env, feed_id: BytesN<32>) -> Option<Bytes>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `feed_id` | `BytesN<32>` |

#### Return Type

`Option<Bytes>`

### `get_request`
```rust
pub fn get_request(env: Env, request_id: BytesN<32>) -> Option<OracleRequest>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `request_id` | `BytesN<32>` |

#### Return Type

`Option<OracleRequest>`

### `source_config_snapshot`
Returns a snapshot of the configured oracle source addresses.  Returns `None` when the contract has not been initialized; callers should treat a `None` result as "no sources configured" and not attempt data requests until the contract is initialized.

```rust
pub fn source_config_snapshot(env: Env) -> Option<OracleSourceSnapshot>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Option<OracleSourceSnapshot>`

### `update_policy_summary`
Returns a deterministic summary of the staleness and update policy.  The summary is safe to cache by clients: it does not change after initialization and does not require any feed-specific parameters. The `cadence` field is `"on_request"` — data is pulled per-request rather than pushed on a fixed schedule.

```rust
pub fn update_policy_summary(env: Env) -> UpdatePolicySummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`UpdatePolicySummary`

### `last_price_freshness`
```rust
pub fn last_price_freshness(env: Env, feed_id: BytesN<32>) -> PriceFreshness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `feed_id` | `BytesN<32>` |

#### Return Type

`PriceFreshness`

