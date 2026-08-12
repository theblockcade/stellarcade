# lobby-escrow

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

### `upsert_escrow`
Create or update an escrow. On update, `required_amount` may only increase (admins can raise the bar but not retroactively shrink the requirement after participants funded). `released` escrows reject updates other than the paused flag.

```rust
pub fn upsert_escrow(env: Env, admin: Address, escrow_id: u32, required_amount: u128, release_delay_secs: u64, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `escrow_id` | `u32` |
| `required_amount` | `u128` |
| `release_delay_secs` | `u64` |
| `paused` | `bool` |

### `fund`
Add a participant stake to the escrow. Each participant may only contribute once — subsequent calls revert so the aggregate counters stay consistent. A paused or already-released escrow rejects new deposits.

```rust
pub fn fund(env: Env, participant: Address, escrow_id: u32, amount: u128)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `participant` | `Address` |
| `escrow_id` | `u32` |
| `amount` | `u128` |

### `release_funds`
Mark the escrow as released. Admin-gated. Reverts when the escrow is paused, underfunded, still in the delay window, or already released.

```rust
pub fn release_funds(env: Env, admin: Address, escrow_id: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `escrow_id` | `u32` |

### `escrow_coverage_summary`
Coverage view: required vs funded + participant count + state.  `coverage_bps = floor(10_000 * total_funded / required_amount)`, clamped at 10_000 (over-funding is fine but doesn't go above 100% in the UI). The `state` enum is the canonical branch signal — `Funding` (not yet at the required amount), `Active` (fully funded), `Paused`, `Released`, `Missing`, or `NotConfigured`.

```rust
pub fn escrow_coverage_summary(env: Env, escrow_id: u32) -> EscrowCoverageSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `escrow_id` | `u32` |

#### Return Type

`EscrowCoverageSummary`

### `release_delay_accessor`
Release-delay view. The state distinguishes underfunded / waiting-for-window / releasable / released / blocked-by-pause, plus the missing / not-configured zero cases.

```rust
pub fn release_delay_accessor(env: Env, escrow_id: u32) -> ReleaseDelayInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `escrow_id` | `u32` |

#### Return Type

`ReleaseDelayInfo`

