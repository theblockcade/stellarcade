use soroban_sdk::{contracttype, Address, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PartnerCommitment {
    pub partner: Address,
    pub total_amount: i128,
    pub released_amount: i128,
    pub remaining_amount: i128,
    pub last_release_time: u64,
    pub is_active: bool,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Release {
    pub timestamp: u64,
    pub amount: i128,
    pub is_processed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReleaseSchedule {
    pub partner: Address,
    pub releases: Vec<Release>,
    pub total_scheduled: i128,
}

/// Aggregated balance summary for a partner's sponsorship ledger.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LedgerBalanceSummary {
    pub partner: Address,
    /// True when a commitment exists in storage.
    pub exists: bool,
    pub total_amount: i128,
    pub released_amount: i128,
    pub remaining_amount: i128,
    /// Percentage of total that has been released (0–100, 0 when empty).
    pub release_pct: u32,
    pub is_active: bool,
    pub is_paused: bool,
}

/// Revocation window info for a partner's sponsorship.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RevocationWindow {
    pub partner: Address,
    /// True when a commitment exists in storage.
    pub exists: bool,
    pub is_active: bool,
    pub is_paused: bool,
    pub remaining_amount: i128,
    /// Number of scheduled releases that have not been processed yet.
    pub pending_release_count: u32,
    /// Number of processed releases.
    pub processed_release_count: u32,
    /// True when there are unprocessed releases and the commitment is active.
    pub can_revoke: bool,
}
