# challenge-ladder

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

### `bracket_health_summary`
Returns a summary of bracket health including player counts and activity levels.

```rust
pub fn bracket_health_summary(env: Env, bracket_id: u32) -> BracketHealthSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bracket_id` | `u32` |

#### Return Type

`BracketHealthSummary`

### `ladder_ranking_snapshot`
Returns a combined ladder ranking snapshot for a bracket (health + cutoff in one call).

```rust
pub fn ladder_ranking_snapshot(env: Env, bracket_id: u32) -> LadderRankingSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bracket_id` | `u32` |

#### Return Type

`LadderRankingSnapshot`

### `tier_cutoff`
Returns tier boundary details for a bracket.

```rust
pub fn tier_cutoff(env: Env, bracket_id: u32) -> TierCutoff
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bracket_id` | `u32` |

#### Return Type

`TierCutoff`

### `promotion_cutoff`
Returns the promotion cutoff details for a bracket.

```rust
pub fn promotion_cutoff(env: Env, bracket_id: u32) -> PromotionCutoff
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bracket_id` | `u32` |

#### Return Type

`PromotionCutoff`

