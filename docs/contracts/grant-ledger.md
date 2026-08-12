# grant-ledger

## Public Methods

### `create_grant`
Creates a grant with a fixed budget. Panics if the id already exists.

```rust
pub fn create_grant(env: Env, id: u64, total_budget: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `total_budget` | `i128` |

### `allocate`
Allocates funds from a grant. Rejects over-allocation so `remaining` never goes negative.

```rust
pub fn allocate(env: Env, id: u64, amount: i128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |
| `amount` | `i128` |

### `allocation_snapshot`
Allocation snapshot for a grant; predictable zero-state when missing.

```rust
pub fn allocation_snapshot(env: Env, id: u64) -> AllocationSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`AllocationSnapshot`

### `exhaustion_risk`
Exhaustion risk for a grant, derived from utilization (allocated vs. total budget). A missing grant reports `RiskLevel::Unknown`.

```rust
pub fn exhaustion_risk(env: Env, id: u64) -> ExhaustionRisk
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`ExhaustionRisk`

### `grant_allocation_summary`
Combined allocation snapshot and risk band in a single call.

```rust
pub fn grant_allocation_summary(env: Env, id: u64) -> GrantAllocationSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`GrantAllocationSummary`

### `milestone_window`
Projects how many more allocations can be made before budget exhaustion, based on the average per-call allocation so far. Requires at least 2 allocations to produce a meaningful estimate.

```rust
pub fn milestone_window(env: Env, id: u64) -> MilestoneWindow
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `id` | `u64` |

#### Return Type

`MilestoneWindow`

