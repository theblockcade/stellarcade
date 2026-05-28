use soroban_sdk::{Address, contracttype};

/// Balance lock status for an escrow entry.
#[contracttype]
#[derive(Clone, PartialEq, Eq)]
pub enum LockStatus {
    /// Locked and cannot be withdrawn yet.
    Locked = 0,
    /// Lock period satisfied; ready for unlock.
    ReadyToUnlock = 1,
    /// Already unlocked and withdrawn.
    Unlocked = 2,
}

/// A single asset locked in escrow with optional vesting schedule.
#[contracttype]
#[derive(Clone)]
pub struct LockedAsset {
    /// Beneficiary who can claim this asset.
    pub beneficiary: Address,
    /// Amount locked (in smallest denomination).
    pub amount: i128,
    /// Ledger number when this asset becomes eligible for unlock.
    pub unlock_ledger: u32,
    /// Unique identifier for this lock entry.
    pub lock_id: u32,
}

/// Summary snapshot of a user's locked balances and readiness state.
#[contracttype]
#[derive(Clone)]
pub struct BalanceLockSummary {
    /// Total amount currently locked across all entries.
    pub total_locked: i128,
    /// Number of lock entries for this user.
    pub lock_count: u32,
    /// Number of locks currently ready to unlock.
    pub ready_to_unlock_count: u32,
    /// Total locked amount that is ready to unlock.
    pub ready_to_unlock_amount: i128,
    /// Ledger of the earliest lock (if any); 0 if no locks exist.
    pub earliest_unlock_ledger: u32,
}

/// Readiness state for a specific lock entry.
#[contracttype]
#[derive(Clone)]
pub struct UnlockReadinessInfo {
    /// Current status (Locked, ReadyToUnlock, Unlocked).
    pub status: LockStatus,
    /// Lock entry ID.
    pub lock_id: u32,
    /// Amount in this lock.
    pub amount: i128,
    /// Ledger when unlock becomes available.
    pub unlock_ledger: u32,
    /// Current ledger (for comparison).
    pub current_ledger: u32,
    /// Ledgers remaining until unlock (0 if ready or unlocked).
    pub ledgers_remaining: u32,
}

/// Storage key discriminants.
#[contracttype]
pub enum DataKey {
    /// Super admin address (instance storage).
    Admin,
    /// Contract state: initialized flag (instance storage).
    Initialized,
    /// LockedAsset entries, keyed by (beneficiary, lock_id) (persistent).
    Lock(Address, u32),
    /// Vec<u32> of lock_ids for a beneficiary (persistent).
    BeneficiaryLocks(Address),
    /// Next auto-incrementing lock_id counter (instance storage).
    NextLockId,
    /// Total locked amount per beneficiary (persistent, for caching).
    BeneficiaryTotalLocked(Address),
}

/// Error codes for contract operations.
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    LockNotFound = 4,
    InvalidAmount = 5,
    InvalidUnlockLedger = 6,
    Overflow = 7,
    EmptyLockState = 8,
}
