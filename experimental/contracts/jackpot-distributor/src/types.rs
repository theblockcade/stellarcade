//! Shared data types for the jackpot distributor contract.

use soroban_sdk::{contracttype, Address};

/// A player's contiguous ticket range within an epoch.
///
/// Ranges are allocated strictly in purchase order, so across all entries
/// of an epoch they are contiguous and non-overlapping: the first range
/// starts at 0 and each subsequent range starts at the previous `end + 1`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TicketRange {
    pub player: Address,
    /// First ticket index owned (inclusive).
    pub start: u64,
    /// Last ticket index owned (inclusive).
    pub end: u64,
}

/// Outcome of an epoch draw.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DrawResult {
    /// Epoch that was drawn.
    pub epoch: u64,
    pub winning_ticket: u64,
    pub winner: Address,
    /// Amount paid out to the winner.
    pub payout: i128,
    /// Amount rolled into the next epoch's seed pool.
    pub carryover: i128,
}

/// Read-only snapshot of the active epoch.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EpochSummary {
    pub epoch: u64,
    pub total_tickets: u64,
    /// Current pool: carried-over seed plus this epoch's ticket sales.
    pub pool_value: i128,
    /// Portion of `pool_value` that was carried in from the previous epoch.
    pub seed_value: i128,
    pub ticket_price: i128,
    /// Basis points of the pool retained as the next epoch's seed.
    pub carryover_bps: u32,
}
