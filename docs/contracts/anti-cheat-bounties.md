# anti-cheat-bounties

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address, token: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `token` | `Address` |

#### Return Type

`Result<(), Error>`

### `post_bounty`
Post a new anti-cheat bounty. The platform funds the reward on-chain.

```rust
pub fn post_bounty(env: Env, poster: Address, game_id: Symbol, reward: i128, min_reporters: u32, report_deadline_ledger: u32) -> Result<u64, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `poster` | `Address` |
| `game_id` | `Symbol` |
| `reward` | `i128` |
| `min_reporters` | `u32` |
| `report_deadline_ledger` | `u32` |

#### Return Type

`Result<u64, Error>`

### `submit_report`
Submit a cheat report against an open bounty. Each address can report at most once per bounty.

```rust
pub fn submit_report(env: Env, reporter: Address, bounty_id: u64, evidence_hash: Symbol) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `reporter` | `Address` |
| `bounty_id` | `u64` |
| `evidence_hash` | `Symbol` |

#### Return Type

`Result<(), Error>`

### `begin_adjudication`
Move a bounty to UnderReview (admin-only).

```rust
pub fn begin_adjudication(env: Env, bounty_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bounty_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `resolve_bounty`
Award or close a bounty (admin-only).

```rust
pub fn resolve_bounty(env: Env, bounty_id: u64, award: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bounty_id` | `u64` |
| `award` | `bool` |

#### Return Type

`Result<(), Error>`

### `open_bounty_summary`
Returns a summary of all open bounties and the total open reward pool.

```rust
pub fn open_bounty_summary(env: Env) -> OpenBountySummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`OpenBountySummary`

### `adjudication_readiness`
Returns adjudication-readiness details for a single bounty. Returns a not-found struct when the bounty_id is unknown.

```rust
pub fn adjudication_readiness(env: Env, bounty_id: u64) -> AdjudicationReadiness
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bounty_id` | `u64` |

#### Return Type

`AdjudicationReadiness`

