use soroban_sdk::{contracttype, Address, Symbol};

/// Lifecycle stage of a bounty.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BountyStatus {
    /// Funded and accepting reports.
    Open,
    /// Under review by adjudicators.
    UnderReview,
    /// Paid out to a reporter.
    Awarded,
    /// Closed without award (no valid reports).
    Closed,
}

/// A posted anti-cheat bounty.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Bounty {
    pub bounty_id: u64,
    pub poster: Address,
    /// Game or context the bounty applies to.
    pub game_id: Symbol,
    /// Reward amount in the contract's token.
    pub reward: i128,
    /// Minimum number of independent reporters required before adjudication.
    pub min_reporters: u32,
    /// Ledger after which no new reports are accepted.
    pub report_deadline_ledger: u32,
    pub status: BountyStatus,
}

/// A cheat report submitted against a specific bounty.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Report {
    pub bounty_id: u64,
    pub reporter: Address,
    /// Evidence hash (e.g. SHA-256 of off-chain data).
    pub evidence_hash: Symbol,
    pub submitted_at_ledger: u32,
}

/// Summary of all open bounties and global state.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OpenBountySummary {
    /// Number of bounties currently in Open status.
    pub open_count: u64,
    /// Number of bounties currently UnderReview.
    pub under_review_count: u64,
    /// Sum of reward amounts across all Open bounties.
    pub total_open_reward: i128,
    /// Current ledger (used to evaluate deadlines).
    pub current_ledger: u32,
}

/// Adjudication-readiness for a single bounty.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AdjudicationReadiness {
    pub bounty_id: u64,
    /// True when the bounty_id exists.
    pub exists: bool,
    pub status: BountyStatus,
    pub report_count: u32,
    pub min_reporters: u32,
    /// True when report_count >= min_reporters.
    pub has_enough_reports: bool,
    /// True when the report deadline has passed.
    pub deadline_passed: bool,
    /// True when both conditions are met (ready to adjudicate).
    pub ready_to_adjudicate: bool,
    pub current_ledger: u32,
}

/// Lifecycle state of a bounty for claim-window purposes.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BountyClaimState {
    /// No bounties have been posted; contract may not be initialized.
    NotConfigured,
    /// Bounty ID is unknown.
    Unknown,
    /// Bounty is open and accepting reports.
    Open,
    /// Bounty is under adjudication review.
    UnderReview,
    /// Reward has been awarded.
    Awarded,
    /// Bounty was closed without an award.
    Closed,
}

/// Summary of all active (Open + UnderReview) bounties for the given game.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveBountySummary {
    /// True when the contract has been initialized.
    pub configured: bool,
    /// Open bounties with a deadline still in the future.
    pub live_count: u64,
    /// Bounties currently under adjudication review.
    pub under_review_count: u64,
    /// Total reward pool across live Open bounties.
    pub total_live_reward: i128,
    /// Current ledger sequence number.
    pub current_ledger: u32,
}

/// Claim-window details for a single bounty.
///
/// Callers supply `claim_window_ledgers` — the number of ledgers after the
/// report deadline within which adjudication must begin.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyClaimWindowAccessor {
    pub bounty_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: BountyClaimState,
    /// Ledger at which reporting closes.
    pub report_deadline_ledger: u32,
    /// Caller-supplied window size (in ledgers) after the deadline.
    pub claim_window_ledgers: u32,
    /// Last ledger within which adjudication should start (deadline + window).
    pub claim_window_end_ledger: u32,
    /// True when we are inside the adjudication window.
    pub in_claim_window: bool,
    /// Ledgers remaining in the window (0 once expired or before deadline).
    pub ledgers_until_window_end: u32,
    pub current_ledger: u32,
}
