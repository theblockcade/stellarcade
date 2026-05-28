# Quest Ledger V2 Contract

## Overview

The Quest Ledger V2 contract manages quest completions, reward processing queues, and reward delays. It provides comprehensive queue monitoring, completion tracking, and configurable reward delay mechanisms for quest-based reward systems.

## Features

- **Quest Completion Tracking**: Record and manage quest completions with reward details
- **Completion Queue Snapshot**: Real-time queue health monitoring and metrics
- **Reward Delay Management**: Configurable delays with priority levels and expedite options
- **Queue Metrics**: Throughput, processing time, and performance analytics
- **Status Management**: Track completion status through the processing pipeline
- **Pause/Unpause**: Emergency pause mechanism for administrative control

## Public Methods

### Administrative Functions

#### `init(env: Env, admin: Address) -> Result<(), Error>`
Initialize the contract with an admin address.

#### `pause(env: Env, admin: Address) -> Result<(), Error>`
Pause all contract mutations (admin only).

#### `unpause(env: Env, admin: Address) -> Result<(), Error>`
Unpause the contract (admin only).

#### `complete_quest(env: Env, player: Address, quest_id: u64, reward_amount: i128, reward_token: Address) -> Result<(), Error>`
Record a quest completion with reward details.

#### `set_reward_delay(env: Env, admin: Address, quest_id: u64, delay_seconds: u64, reason: Symbol) -> Result<(), Error>`
Set a reward delay for a specific quest with a reason.

#### `update_completion_status(env: Env, admin: Address, quest_id: u64, new_status: Symbol) -> Result<(), Error>`
Update the status of a quest completion.

### Read-Only Functions

#### `get_completion_queue_snapshot(env: Env) -> Result<CompletionQueueSnapshot, Error>`
Get a comprehensive snapshot of the completion queue including:
- Total pending, processing, and delayed completions
- Oldest and newest pending timestamps
- Average processing time
- Queue health score (0-100)

#### `get_reward_delay_accessor(env: Env, quest_id: u64) -> Result<RewardDelayAccessor, Error>`
Get detailed reward delay information for a quest including:
- Base and current delay
- Delay reason
- Estimated processing time
- Priority level (1-5)
- Expedite availability

#### `get_quest_completion(env: Env, quest_id: u64) -> Result<QuestCompletion, Error>`
Get the complete details of a quest completion.

#### `get_queue_metrics(env: Env) -> Result<QueueMetrics, Error>`
Get comprehensive queue performance metrics including:
- Total, pending, processing, delayed, and failed completions
- Average completion time
- Throughput per hour

## Data Structures

### QuestCompletion
```rust
pub struct QuestCompletion {
    pub quest_id: u64,
    pub player: Address,
    pub completed_at: u64,
    pub reward_amount: i128,
    pub reward_token: Address,
    pub status: Symbol,  // "PENDING", "PROCESSED", "DELAYED"
}
```

### CompletionQueueSnapshot
```rust
pub struct CompletionQueueSnapshot {
    pub timestamp: u64,
    pub total_pending: u32,
    pub total_processing: u32,
    pub total_delayed: u32,
    pub oldest_pending: Option<u64>,
    pub newest_pending: Option<u64>,
    pub average_processing_time: u64,
    pub queue_health_score: u32,  // 0-100
}
```

### RewardDelayAccessor
```rust
pub struct RewardDelayAccessor {
    pub quest_id: u64,
    pub base_delay: u64,
    pub current_delay: u64,
    pub delay_reason: Symbol,
    pub estimated_processing_time: u64,
    pub priority_level: u32,  // 1-5, 1 being highest
    pub can_expedite: bool,
}
```

### QueueMetrics
```rust
pub struct QueueMetrics {
    pub total_completions: u32,
    pub pending_completions: u32,
    pub processing_completions: u32,
    pub delayed_completions: u32,
    pub failed_completions: u32,
    pub average_completion_time: u64,
    pub throughput_per_hour: u32,
}
```

## Completion Status Values

- **PENDING**: Quest completed, awaiting processing
- **PROCESSING**: Currently being processed
- **COMPLETED**: Successfully processed and rewarded
- **DELAYED**: Processing delayed (see delay reason)
- **FAILED**: Processing failed

## Priority Levels

1. **Critical** - Highest priority, immediate processing
2. **High** - Expedited processing
3. **Medium** - Standard processing (default)
4. **Low** - Lower priority
5. **Deferred** - Lowest priority, can be delayed

## Error Codes

- `NotInitialized (1)`: Contract not initialized
- `AlreadyInitialized (2)`: Contract already initialized
- `Unauthorized (3)`: Caller is not admin
- `Paused (4)`: Contract is paused
- `QuestNotFound (5)`: Quest does not exist
- `CompletionNotFound (6)`: Completion record not found
- `InvalidQuestId (7)`: Invalid quest ID (zero)
- `InvalidAmount (8)`: Invalid reward amount
- `QuestAlreadyCompleted (9)`: Quest already completed
- `InvalidDelay (10)`: Invalid delay value

## Usage Example

```rust
// Initialize contract
QuestLedgerV2::init(env.clone(), admin.clone())?;

// Record quest completion
QuestLedgerV2::complete_quest(
    env.clone(),
    player_address,
    quest_id,
    100,  // reward amount
    token_address
)?;

// Set reward delay if needed
QuestLedgerV2::set_reward_delay(
    env.clone(),
    admin.clone(),
    quest_id,
    3600,  // 1 hour delay
    symbol_short!("REVIEW")
)?;

// Get queue snapshot for monitoring
let snapshot = QuestLedgerV2::get_completion_queue_snapshot(env.clone())?;
if snapshot.queue_health_score < 50 {
    // Queue health is degraded, take action
}

// Check reward delay status
let delay_info = QuestLedgerV2::get_reward_delay_accessor(env.clone(), quest_id)?;
if delay_info.can_expedite {
    // Expedite processing if needed
}

// Update completion status
QuestLedgerV2::update_completion_status(
    env.clone(),
    admin.clone(),
    quest_id,
    symbol_short!("COMPLETE")
)?;
```

## Queue Health Score

The queue health score (0-100) is calculated based on:
- Queue size relative to capacity
- Average processing time
- Error rate
- Throughput trends

A score below 70 indicates potential issues that may require attention.

## Testing

Run tests with:
```bash
cargo test
```

The contract includes comprehensive test coverage for:
- Quest completion flow
- Queue snapshot generation
- Reward delay management
- Empty state handling
- Paused state behavior
- Authorization enforcement
- Invalid input handling
- Duplicate completion prevention
