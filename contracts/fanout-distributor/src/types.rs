use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum BatchStatus {
    Pending,
    InProgress,
    Completed,
    NotConfigured,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BatchRecord {
    pub batch_id: u64,
    pub total_amount: i128,
    pub distributed_amount: i128,
    pub recipient_count: u32,
    pub completed: bool,
    pub failed: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BatchProgressSummary {
    pub configured: bool,
    pub total_batches: u64,
    pub completed_batches: u64,
    pub pending_batches: u64,
    pub total_distributed: i128,
    pub failed_batches: u32,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct RetryableFailure {
    pub batch_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub status: BatchStatus,
    pub failed: bool,
    pub total_amount: i128,
    pub distributed_amount: i128,
    pub now: u64,
}

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum BatchHealthBand {
    NotConfigured,
    Missing,
    Healthy,
    Partial,
    Failed,
    Completed,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BatchHealthSnapshot {
    pub batch_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub status: BatchStatus,
    pub health_band: BatchHealthBand,
    pub total_amount: i128,
    pub distributed_amount: i128,
    pub remaining_amount: i128,
    pub recipient_count: u32,
    pub progress_bps: u32,
    pub failed: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct RetryGap {
    pub batch_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub status: BatchStatus,
    pub failed: bool,
    pub retry_gap_ledgers: u32,
    pub retry_after_ledger: u32,
    pub current_ledger: u32,
    pub can_retry: bool,
}
