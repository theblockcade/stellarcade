use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Perk {
    pub id: u64,
    /// Number of queued claimants required before claiming unlocks.
    pub threshold: u32,
    pub queued_count: u32,
    pub claimed_count: u32,
    pub is_active: bool,
}

/// Point-in-time view of a perk's claim queue.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimQueueSnapshot {
    pub perk_exists: bool,
    pub threshold: u32,
    pub queued_count: u32,
    pub claimed_count: u32,
    pub is_threshold_met: bool,
}

/// How far the queue is from unlocking claims.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ThresholdGap {
    pub perk_exists: bool,
    pub threshold: u32,
    pub queued_count: u32,
    /// Additional queued claimants still needed (0 once met).
    pub gap: u32,
    /// Progress toward the threshold in basis points (0..10_000), integer floor.
    pub progress_bps: u32,
}
