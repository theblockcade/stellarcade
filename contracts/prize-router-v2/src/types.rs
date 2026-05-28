use soroban_sdk::{contracttype, Address};

/// A pending payout entry in the route queue.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PendingPayout {
    pub recipient: Address,
    /// Amount in stroops or token-smallest-unit.
    pub amount: i128,
    /// Ledger sequence at which this payout was enqueued.
    pub enqueued_at: u32,
    /// Minimum ledger sequence before which this payout may not be released.
    pub release_after: u32,
}

/// Aggregated route pressure summary returned by `route_pressure_summary`.
///
/// Zero-state: all counts/amounts 0, `overloaded` false.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoutePressureSummary {
    /// Number of pending payouts in the queue.
    pub pending_count: u32,
    /// Sum of all pending amounts.
    pub total_pending_amount: i128,
    /// Payouts that have passed their `release_after` ledger and are immediately
    /// releasable.
    pub releasable_count: u32,
    /// True when `pending_count` exceeds the configured `pressure_threshold`.
    pub overloaded: bool,
}

/// Per-payout delay information returned by `payout_delay`.
///
/// Zero-state: `found` false when no payout exists for the given index.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PayoutDelayInfo {
    /// Whether a payout was found at this index.
    pub found: bool,
    /// Ledgers remaining until the payout is releasable (0 if already releasable).
    pub ledgers_remaining: u32,
    /// Whether the payout is immediately releasable.
    pub releasable: bool,
}
