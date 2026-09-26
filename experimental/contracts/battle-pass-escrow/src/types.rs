use soroban_sdk::{contracterror, contractevent, contracttype, Address, Vec};

/// Persistent storage TTL in ledgers (~30 days at 5 s/ledger).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
pub enum DataKey {
    // --- instance() ---
    Oracle,
    Token,
    Initialized,
    // --- persistent() ---
    SeasonPool(u64),
    PlayerProgress(Address, u64),
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    InvalidInput = 4,
    InsufficientBalance = 5,
    MilestoneNotUnlocked = 6,
    AlreadyClaimed = 7,
    SeasonNotFound = 8,
    MilestoneNotFound = 9,
}

#[contractevent]
pub struct Initialized {
    pub oracle: Address,
    pub token: Address,
}

#[contractevent]
pub struct Funded {
    pub sponsor: Address,
    pub season_id: u64,
    pub amount: i128,
}

#[contractevent]
pub struct XPUpdated {
    pub oracle: Address,
    pub player: Address,
    pub season_id: u64,
    pub xp_delta: u128,
    pub total_xp: u128,
}

#[contractevent]
pub struct MilestoneClaimed {
    pub player: Address,
    pub season_id: u64,
    pub milestone_idx: u32,
    pub amount: i128,
}

#[contractevent]
pub struct SeasonRollover {
    pub from_season: u64,
    pub to_season: u64,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct SeasonPool {
    pub season_id: u64,
    pub total_pool: i128,
    pub claimed_amount: i128,
    pub milestone_rewards: Vec<Milestone>,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub xp_threshold: u128,
    pub reward_amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct PlayerProgress {
    pub total_xp: u128,
    pub claimed_milestones: Vec<u32>,
}

#[contracttype]
#[derive(Clone)]
pub struct SeasonPoolSummary {
    pub season_id: u64,
    pub total_pool: i128,
    pub claimed_amount: i128,
    pub unclaimed_amount: i128,
    pub milestone_count: u32,
}
