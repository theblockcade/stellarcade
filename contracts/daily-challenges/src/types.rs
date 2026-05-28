use soroban_sdk::{contracttype, Address, Symbol};

/// A single daily challenge definition.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DailyChallenge {
    pub id: Symbol,
    pub description: Symbol,
    /// Ledger at which this challenge was activated.
    pub activated_at: u32,
    /// Ledger at which this challenge expires (0 = no expiry).
    pub expires_at: u32,
    /// Reward amount in token-smallest-unit.
    pub reward: i128,
    pub active: bool,
}

/// Snapshot of a player's completion state for a challenge.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CompletionSnapshot {
    /// Whether a record exists for this (challenge, player) pair.
    pub exists: bool,
    pub completed: bool,
    /// Ledger at which the completion was recorded (0 if not completed).
    pub completed_at: u32,
    /// Whether the reward has already been claimed.
    pub claimed: bool,
}

/// Information about the next refresh window, returned by `refresh_window`.
///
/// Zero-state: `configured` false when no refresh interval has been set.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RefreshWindowInfo {
    /// Whether a refresh interval has been configured.
    pub configured: bool,
    /// The refresh interval in ledgers.
    pub interval_ledgers: u32,
    /// The ledger at which the last refresh occurred (0 if never).
    pub last_refresh_at: u32,
    /// The ledger at which the next refresh is due.
    pub next_refresh_at: u32,
    /// Ledgers remaining until the next refresh (0 if overdue).
    pub ledgers_until_refresh: u32,
    /// Whether a refresh is currently overdue.
    pub overdue: bool,
}
