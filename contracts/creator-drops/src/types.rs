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

/// Allocation snapshot: how supply is split between claimed and remaining.
///
/// Mirrors the codebase pattern where a missing/unconfigured entity returns
/// zeroed fields with `exists: false`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DropAllocationSnapshot {
    pub drop_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub total_supply: u32,
    pub claimed_supply: u32,
    pub remaining_supply: u32,
    /// Claimed supply expressed in basis points of total supply (floor div).
    pub claimed_bps: u32,
    /// Remaining supply expressed in basis points of total supply (floor div).
    pub remaining_bps: u32,
    /// True when remaining_supply == 0.
    pub is_fully_allocated: bool,
}

/// Claim-window state for a single drop.
///
/// Callers supply `claim_window_ledgers` — the number of ledgers *after*
/// `ends_at` within which a late claim may still be processed off-chain.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DropClaimWindowAccessor {
    pub drop_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: DropWindowState,
    pub starts_at: u64,
    pub ends_at: u64,
    pub now: u64,
    /// Caller-supplied window size (seconds) after the drop closes.
    pub claim_window_secs: u64,
    /// Last timestamp within which a late claim may still be processed.
    pub claim_window_end: u64,
    /// True when the drop has closed but we are still within the claim window.
    pub in_claim_window: bool,
    /// Seconds remaining in the claim window (0 when outside or before).
    pub secs_until_window_end: u64,
    pub can_claim: bool,
}
