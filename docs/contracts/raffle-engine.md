# raffle-engine

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address, min_tickets_required: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `min_tickets_required` | `u32` |

### `upsert_round`
```rust
pub fn upsert_round(env: Env, admin: Address, round_id: u64, total_tickets: u32, unique_players: u32, common_tickets: u32, rare_tickets: u32, epic_tickets: u32, sales_closed: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `round_id` | `u64` |
| `total_tickets` | `u32` |
| `unique_players` | `u32` |
| `common_tickets` | `u32` |
| `rare_tickets` | `u32` |
| `epic_tickets` | `u32` |
| `sales_closed` | `bool` |

### `ticket_distribution_summary`
```rust
pub fn ticket_distribution_summary(env: Env, round_id: u64) -> TicketDistributionSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `round_id` | `u64` |

#### Return Type

`TicketDistributionSummary`

### `draw_readiness`
```rust
pub fn draw_readiness(env: Env, round_id: u64) -> DrawReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `round_id` | `u64` |

#### Return Type

`DrawReadiness`

