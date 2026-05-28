use soroban_sdk::{contracttype, Address, Vec};

/// Summary of active lots in the auction house.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveLotSummary {
    /// Total number of active lots.
    pub total_active_lots: u32,
    /// Number of lots currently in bidding.
    pub lots_in_bidding: u32,
    /// Total value of all active lots.
    pub total_lot_value: i128,
}

/// Snapshot of the current bid window.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BidWindowSnapshot {
    /// Current bid window start time.
    pub window_start: u64,
    /// Current bid window end time.
    pub window_end: u64,
    /// Number of active bids in current window.
    pub active_bids: u32,
    /// Highest bid in current window.
    pub highest_bid: i128,
}