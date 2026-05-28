# sponsor-pool

## Public Methods

### `init`
Initialise the pool with an admin who can register / settle / cancel campaigns.

```rust
pub fn init(env: Env, admin: Address)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

### `register_campaign`
Register a new sponsorship campaign. Idempotent on `campaign_id`: re-registration with the same id panics so the operator notices.

```rust
pub fn register_campaign(env: Env, admin: Address, campaign_id: u64, beneficiary: Address, token: Address, target_amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `campaign_id` | `u64` |
| `beneficiary` | `Address` |
| `token` | `Address` |
| `target_amount` | `i128` |

### `commit_funds`
Add `amount` worth of funds to `campaign_id`. The pool only tracks the committed amount; actual token movement is handled by the caller (treasury contract or user-side transfer) since on-chain custody is out of scope for the issue.

```rust
pub fn commit_funds(env: Env, sponsor: Address, campaign_id: u64, amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `sponsor` | `Address` |
| `campaign_id` | `u64` |
| `amount` | `i128` |

### `settle`
Mark a campaign settled. Releases the committed amount as "settled" in the aggregate counters.

```rust
pub fn settle(env: Env, admin: Address, campaign_id: u64) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `campaign_id` | `u64` |

#### Return Type

`i128`

### `cancel`
Cancel a campaign. Returns the amount that was committed at cancel time so the caller can refund sponsors out-of-band.

```rust
pub fn cancel(env: Env, admin: Address, campaign_id: u64) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `campaign_id` | `u64` |

#### Return Type

`i128`

### `committed_funds_summary`
Aggregate snapshot of the pool's committed funds across every state.

```rust
pub fn committed_funds_summary(env: Env) -> CommittedFundsSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`CommittedFundsSummary`

### `campaign_coverage`
Coverage view for a single campaign. Collapses to the documented fallback when the id is unknown or the pool is unconfigured so the frontend can render without a separate lookup.

```rust
pub fn campaign_coverage(env: Env, campaign_id: u64) -> CampaignCoverage
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `campaign_id` | `u64` |

#### Return Type

`CampaignCoverage`

