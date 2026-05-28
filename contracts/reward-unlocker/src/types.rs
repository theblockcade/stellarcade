use soroban_sdk::{Address, contracttype};

/// Queue state for a pending reward unlock.
#[contracttype]
#[derive(Clone, PartialEq, Eq)]
pub enum QueueStatus {
    /// Queued and waiting for unlock window.
    Pending = 0,
    /// Cooldown period is active.
    InCooldown = 1,
    /// Ready to claim from queue.
    ReadyToClaim = 2,
}

/// A reward entry awaiting unlock.
#[contracttype]
#[derive(Clone)]
pub struct QueuedReward {
    /// Beneficiary who can claim this reward.
    pub recipient: Address,
    /// Reward amount (in smallest denomination).
    pub amount: i128,
    /// Ledger when queued.
    pub queued_ledger: u32,
    /// Cooldown duration in ledgers from queued_ledger.
    pub cooldown_ledgers: u32,
    /// Unique identifier for this queue entry.
    pub queue_id: u32,
}

/// Summary snapshot of queued rewards and cooldown status.
#[contracttype]
#[derive(Clone)]
pub struct UnlockQueueSummary {
    /// Total rewards awaiting unlock.
    pub total_queued_amount: i128,
    /// Number of entries in the queue.
    pub queue_size: u32,
    /// Number of entries currently in cooldown.
    pub in_cooldown_count: u32,
    /// Number of entries ready to claim.
    pub ready_to_claim_count: u32,
    /// Earliest unlock time (current ledger if queue empty).
    pub earliest_ready_ledger: u32,
}

/// Cooldown gap information for a queue entry.
#[contracttype]
#[derive(Clone)]
pub struct CooldownGapInfo {
    /// Queue entry ID.
    pub queue_id: u32,
    /// Current status of this queue entry.
    pub status: QueueStatus,
    /// Amount in this queue entry.
    pub amount: i128,
    /// Ledger when this entry was queued.
    pub queued_ledger: u32,
    /// Cooldown duration applied.
    pub cooldown_ledgers: u32,
    /// Unlock eligibility ledger (queued + cooldown).
    pub unlock_eligible_ledger: u32,
    /// Current ledger.
    pub current_ledger: u32,
    /// Ledgers remaining in cooldown (0 if ready or missing).
    pub ledgers_remaining_in_cooldown: u32,
}

/// Storage key discriminants.
#[contracttype]
pub enum DataKey {
    /// Super admin address (instance storage).
    Admin,
    /// Contract state: initialized flag (instance storage).
    Initialized,
    /// QueuedReward entries, keyed by (recipient, queue_id) (persistent).
    QueuedReward(Address, u32),
    /// Vec<u32> of queue_ids for a recipient (persistent).
    RecipientQueues(Address),
    /// Next auto-incrementing queue_id counter (instance storage).
    NextQueueId,
    /// Total queued amount per recipient (persistent, for caching).
    RecipientTotalQueued(Address),
}

/// Error codes for contract operations.
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    QueueEntryNotFound = 4,
    InvalidAmount = 5,
    InvalidCooldown = 6,
    Overflow = 7,
    EmptyQueue = 8,
}
