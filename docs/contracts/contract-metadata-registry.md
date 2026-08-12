# contract-metadata-registry

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

### `register_metadata`
```rust
pub fn register_metadata(env: Env, contract_id: Address, version: u32, schema_hash: BytesN<32>, docs_uri: String) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contract_id` | `Address` |
| `version` | `u32` |
| `schema_hash` | `BytesN<32>` |
| `docs_uri` | `String` |

#### Return Type

`Result<(), Error>`

### `update_metadata`
```rust
pub fn update_metadata(env: Env, contract_id: Address, version: u32, schema_hash: BytesN<32>, docs_uri: String) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contract_id` | `Address` |
| `version` | `u32` |
| `schema_hash` | `BytesN<32>` |
| `docs_uri` | `String` |

#### Return Type

`Result<(), Error>`

### `metadata_of`
```rust
pub fn metadata_of(env: Env, contract_id: Address) -> Option<MetadataRecord>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contract_id` | `Address` |

#### Return Type

`Option<MetadataRecord>`

### `latest_published`
```rust
pub fn latest_published(env: Env, contract_id: Address) -> Option<MetadataRecord>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contract_id` | `Address` |

#### Return Type

`Option<MetadataRecord>`

### `history`
```rust
pub fn history(env: Env, contract_id: Address) -> Vec<MetadataRecord>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contract_id` | `Address` |

#### Return Type

`Vec<MetadataRecord>`

### `history_bounded`
```rust
pub fn history_bounded(env: Env, contract_id: Address, limit: u32) -> Vec<MetadataRecord>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contract_id` | `Address` |
| `limit` | `u32` |

#### Return Type

`Vec<MetadataRecord>`

### `is_initialized`
```rust
pub fn is_initialized(env: Env) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`bool`

### `admin`
```rust
pub fn admin(env: Env) -> Option<Address>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`Option<Address>`

### `is_registered`
```rust
pub fn is_registered(env: Env, contract_id: Address) -> bool
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contract_id` | `Address` |

#### Return Type

`bool`

### `metadata_summary`
```rust
pub fn metadata_summary(env: Env, contract_id: Address) -> MetadataSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `contract_id` | `Address` |

#### Return Type

`MetadataSummary`

### `list_registered`
```rust
pub fn list_registered(env: Env, start: u32, limit: u32) -> Vec<Address>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `start` | `u32` |
| `limit` | `u32` |

#### Return Type

`Vec<Address>`

### `registry_config`
```rust
pub fn registry_config(env: Env) -> RegistryConfig
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`RegistryConfig`

