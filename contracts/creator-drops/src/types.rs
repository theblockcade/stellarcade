use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum DropWindowState {
    NotConfigured,
    Missing,
    Scheduled,
    Open,
    Closed,
    SoldOut,
    Paused,
}

/// Storage-backed drop state reused by the snapshot and saturation reads.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DropRecord {
    pub drop_id: u64,
    pub creator: Address,
    pub starts_at: u64,
    pub ends_at: u64,
    pub total_supply: u32,
    pub claimed_supply: u32,
    pub claim_count: u32,
    pub paused: bool,
}

/// Mutable configuration supplied when a drop is created or updated.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DropConfigInput {
    pub creator: Address,
    pub starts_at: u64,
    pub ends_at: u64,
    pub total_supply: u32,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DropWindowSnapshot {
    pub drop_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: DropWindowState,
    pub creator: Option<Address>,
    pub now: u64,
    pub starts_at: u64,
    pub ends_at: u64,
    pub total_supply: u32,
    pub claimed_supply: u32,
    pub remaining_supply: u32,
    pub claim_count: u32,
    pub can_claim: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimSaturation {
    pub drop_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub paused: bool,
    pub total_supply: u32,
    pub claimed_supply: u32,
    pub remaining_supply: u32,
    pub claim_count: u32,
    pub saturation_bps: u32,
    pub can_claim: bool,
}
