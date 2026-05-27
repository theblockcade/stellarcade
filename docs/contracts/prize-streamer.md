# prize-streamer

## Public Methods

### `init`
Initialize the contract. May only be called once.

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

### `upsert_stream`
Write or update a stream record. Admin only.  Existing records are fully replaced. Callers may read, modify, then re-submit to update individual fields.

```rust
pub fn upsert_stream(env: Env, admin: Address, stream_id: u32, total_streamed: i128, outflow_rate_per_ledger: i128, last_outflow_ledger: u32, is_draining: bool, total_funding: i128, funding_target: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `stream_id` | `u32` |
| `total_streamed` | `i128` |
| `outflow_rate_per_ledger` | `i128` |
| `last_outflow_ledger` | `u32` |
| `is_draining` | `bool` |
| `total_funding` | `i128` |
| `funding_target` | `i128` |

#### Return Type

`Result<(), Error>`

### `stream_outflow_summary`
Return aggregated outflow metrics for `stream_id`.  Unknown stream ids return `exists = false` with zeroed numeric fields. A paused or exhausted stream is surfaced via `is_draining = false`.

```rust
pub fn stream_outflow_summary(env: Env, stream_id: u32) -> StreamOutflowSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `stream_id` | `u32` |

#### Return Type

`StreamOutflowSummary`

### `funding_gap`
Return the funding gap report for `stream_id`.  Unknown stream ids return `exists = false` with zeroed numeric fields. `gap_amount` is floored at zero — a fully-funded stream returns zero. `is_underfunded` is `true` when `current_balance < funding_target`.

```rust
pub fn funding_gap(env: Env, stream_id: u32) -> FundingGap
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `stream_id` | `u32` |

#### Return Type

`FundingGap`

