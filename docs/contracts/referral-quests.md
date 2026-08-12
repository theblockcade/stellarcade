# referral-quests

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

### `upsert_quest`
Create or update a quest. Existing counters and totals are preserved — admins typically tweak `payout_per_completion` or the `paused` flag without resetting the queue.

```rust
pub fn upsert_quest(env: Env, admin: Address, quest_id: u32, payout_per_completion: u128, paused: bool)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `quest_id` | `u32` |
| `payout_per_completion` | `u128` |
| `paused` | `bool` |

### `record_completion`
Record that `user` completed `quest_id`. Idempotent in the sense that a second call with the same `(quest_id, user)` pair panics — completions are unique per-user-per-quest by design.

```rust
pub fn record_completion(env: Env, admin: Address, user: Address, quest_id: u32, completed_at: u64)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `user` | `Address` |
| `quest_id` | `u32` |
| `completed_at` | `u64` |

### `mark_paid`
Flip a completion from pending → paid. Decrements `pending_count` and increments `paid_count`, and shifts the same amount from `total_payout_owed` (which conceptually tracks "outstanding") to `total_payout_paid`. Reverts if the completion is missing or already paid.

```rust
pub fn mark_paid(env: Env, admin: Address, user: Address, quest_id: u32)
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `user` | `Address` |
| `quest_id` | `u32` |

### `completion_queue_summary`
Compact view of the completion queue for `quest_id`.

```rust
pub fn completion_queue_summary(env: Env, quest_id: u32) -> CompletionQueueSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `quest_id` | `u32` |

#### Return Type

`CompletionQueueSummary`

### `payout_gap_accessor`
Payout gap (owed - paid) and the two underlying totals.

```rust
pub fn payout_gap_accessor(env: Env, quest_id: u32) -> PayoutGapInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `quest_id` | `u32` |

#### Return Type

`PayoutGapInfo`

### `quest_progress_snapshot`
Return a snapshot of a user's quest progress for a specific quest.  Missing quests return `quest_exists = false`. Missing completions return `completion_exists = false` with zeroed timing fields.

```rust
pub fn quest_progress_snapshot(env: Env, quest_id: u32, user: Address) -> QuestProgressSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `quest_id` | `u32` |
| `user` | `Address` |

#### Return Type

`QuestProgressSnapshot`

### `reward_decay`
Return reward-decay info for a quest, showing how much of the total owed reward has been paid out.  `decay_pct` is the ratio of `total_payout_paid` to `(total_payout_paid + total_payout_owed)`, representing the percentage of the total reward pool that has decayed (been paid).

```rust
pub fn reward_decay(env: Env, quest_id: u32) -> RewardDecayInfo
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `quest_id` | `u32` |

#### Return Type

`RewardDecayInfo`

