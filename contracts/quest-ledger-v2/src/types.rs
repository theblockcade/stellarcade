#![no_std]

use soroban_sdk::{contracttype, Address, Symbol};

/// Quest completion status types
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum CompletionStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Delayed,
    Cancelled,
}

/// Priority levels for quest processing
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum PriorityLevel {
    Critical = 1,
    High = 2,
    Medium = 3,
    Low = 4,
    Deferred = 5,
}

/// Delay reasons for reward processing
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum DelayReason {
    ManualReview,
    InsufficientFunds,
    SystemMaintenance,
    SecurityCheck,
    ComplianceReview,
    TechnicalIssue,
}

/// Extended quest completion with additional metadata
#[derive(Clone)]
#[contracttype]
pub struct ExtendedQuestCompletion {
    pub quest_id: u64,
    pub player: Address,
    pub completed_at: u64,
    pub reward_amount: i128,
    pub reward_token: Address,
    pub status: CompletionStatus,
    pub priority: PriorityLevel,
    pub attempts: u32,
    pub last_attempt: Option<u64>,
    pub error_message: Option<Symbol>,
    pub metadata: Symbol,
}

/// Detailed reward delay information
#[derive(Clone)]
#[contracttype]
pub struct DetailedRewardDelay {
    pub quest_id: u64,
    pub base_delay: u64,
    pub current_delay: u64,
    pub delay_reason: DelayReason,
    pub estimated_processing_time: u64,
    pub priority_level: PriorityLevel,
    pub can_expedite: bool,
    pub expedite_cost: Option<i128>,
    pub auto_retry_enabled: bool,
    pub max_retries: u32,
    pub retry_interval: u64,
}

/// Comprehensive queue snapshot with analytics
#[derive(Clone)]
#[contracttype]
pub struct DetailedQueueSnapshot {
    pub timestamp: u64,
    pub total_pending: u32,
    pub total_processing: u32,
    pub total_completed: u32,
    pub total_failed: u32,
    pub total_delayed: u32,
    pub total_cancelled: u32,
    pub oldest_pending: Option<u64>,
    pub newest_pending: Option<u64>,
    pub average_processing_time: u64,
    pub median_processing_time: u64,
    pub queue_health_score: u32,
    pub throughput_last_hour: u32,
    pub throughput_last_day: u32,
    pub error_rate: u32, // Percentage
    pub retry_rate: u32, // Percentage
}

/// Queue performance metrics
#[derive(Clone)]
#[contracttype]
pub struct QueuePerformanceMetrics {
    pub total_processed: u64,
    pub success_rate: u32, // Percentage
    pub average_completion_time: u64,
    pub peak_queue_size: u32,
    pub current_queue_size: u32,
    pub processing_capacity: u32,
    pub bottleneck_indicators: Symbol,
    pub recommended_actions: Symbol,
}

/// Quest configuration for processing rules
#[derive(Clone)]
#[contracttype]
pub struct QuestProcessingConfig {
    pub quest_id: u64,
    pub auto_process: bool,
    pub require_manual_review: bool,
    pub max_reward_amount: i128,
    pub processing_timeout: u64,
    pub retry_policy: Symbol,
    pub notification_settings: Symbol,
}

/// Batch processing result
#[derive(Clone)]
#[contracttype]
pub struct BatchProcessingResult {
    pub batch_id: u64,
    pub processed_count: u32,
    pub success_count: u32,
    pub failed_count: u32,
    pub skipped_count: u32,
    pub total_reward_amount: i128,
    pub processing_time: u64,
    pub errors: Symbol, // Serialized error summary
}

/// Event data for quest operations
#[derive(Clone)]
#[contracttype]
pub struct QuestEvent {
    pub event_type: Symbol,
    pub quest_id: u64,
    pub player: Address,
    pub timestamp: u64,
    pub data: Symbol,
}