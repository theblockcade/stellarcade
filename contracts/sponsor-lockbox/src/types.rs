use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LockRecord {
    pub lock_id: u64,
    pub sponsor: Address,
    pub beneficiary: Address,
    pub amount: i128,
    pub unlock_at: u64,
    pub released: bool,
    pub cancelled: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiabilitySnapshot {
    pub configured: bool,
    pub active_count: u32,
    pub active_amount: i128,
    pub releasable_count: u32,
    pub releasable_amount: i128,
    pub released_count: u32,
    pub released_amount: i128,
    pub cancelled_count: u32,
    pub cancelled_amount: i128,
    pub now: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UnlockQueueAccessor {
    pub configured: bool,
    pub indexed_locks: u32,
    pub pending_count: u32,
    pub pending_amount: i128,
    pub releasable_count: u32,
    pub releasable_amount: i128,
    pub next_unlock_at: u64,
    pub now: u64,
}
