# campaign-claims

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

### `upsert_campaign`
Create or update a campaign definition while preserving committed claim accounting. `budget` must remain at or above the already committed amount so existing pending or claimed rewards stay valid.

```rust
pub fn upsert_campaign(env: Env, admin: Address, campaign_id: u64, budget: i128, starts_at: u64, ends_at: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `campaign_id` | `u64` |
| `budget` | `i128` |
| `starts_at` | `u64` |
| `ends_at` | `u64` |
| `paused` | `bool` |

### `record_claim`
Commit budget for a pending user claim during the active claim window. This reduces `remaining_budget` immediately so the accessor never needs to reconstruct commitment totals from individual claimant balances.

```rust
pub fn record_claim(env: Env, admin: Address, campaign_id: u64, user: Address, amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `campaign_id` | `u64` |
| `user` | `Address` |
| `amount` | `i128` |

### `claim`
Claim the caller's committed reward. Paused campaigns intentionally block this path so reads and writes agree on the currently blocked state.

```rust
pub fn claim(env: Env, user: Address, campaign_id: u64) -> i128
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `campaign_id` | `u64` |

#### Return Type

`i128`

### `claim_window_summary`
Return a stable claim-window summary for `campaign_id`.  Before `init` the response is zeroed with `configured = false` and `state = NotConfigured`. Unknown campaign ids after initialization return `configured = true`, `exists = false`, and `state = Missing`. Time-state uses the current ledger timestamp and the window is open when `starts_at <= now <= ends_at`.

```rust
pub fn claim_window_summary(env: Env, campaign_id: u64) -> ClaimWindowSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `campaign_id` | `u64` |

#### Return Type

`ClaimWindowSummary`

### `budget_exhaustion`
Return a compact budget exhaustion view for `campaign_id`.  `exhaustion_bps` uses floor division in basis points: `committed_budget * 10_000 / budget`. Missing and not-yet-configured campaigns return zero balances and `exhaustion_bps = 0`.

```rust
pub fn budget_exhaustion(env: Env, campaign_id: u64) -> BudgetExhaustion
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `campaign_id` | `u64` |

#### Return Type

`BudgetExhaustion`

