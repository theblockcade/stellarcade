use soroban_sdk::{contracttype, Address};

/// Lifecycle of a sponsorship campaign within the pool.
#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum CampaignStatus {
    /// Campaign id is unknown to the pool.
    Unknown,
    /// Pool has not been initialised yet.
    NotConfigured,
    /// Campaign is registered and accepting commitments.
    Open,
    /// Campaign has been fully funded and committed funds released.
    Settled,
    /// Campaign was cancelled before settlement; remaining funds released back.
    Cancelled,
}

/// On-chain record for a single sponsorship campaign.
#[contracttype]
#[derive(Clone, Debug)]
pub struct CampaignRecord {
    pub campaign_id: u64,
    /// Beneficiary that receives funds on settlement.
    pub beneficiary: Address,
    /// Token contract used by every commitment to this campaign.
    pub token: Address,
    /// Amount the operator targets for this campaign.
    pub target_amount: i128,
    /// Sum of every commit_funds call against this campaign.
    pub committed_amount: i128,
    /// True after `settle` succeeds.
    pub settled: bool,
    /// True after `cancel` succeeds.
    pub cancelled: bool,
}

/// Aggregate snapshot returned by `committed_funds_summary()`.
///
/// Reuses the in-storage instance counters so callers don't need to fan out
/// across every campaign to compute totals — matches the issue's
/// "reuse tracked storage aggregates when possible" guidance.
#[contracttype]
#[derive(Clone, Debug)]
pub struct CommittedFundsSummary {
    pub configured: bool,
    /// Number of campaigns currently in `Open` state.
    pub open_campaigns: u32,
    /// Number of campaigns settled (terminal).
    pub settled_campaigns: u32,
    /// Number of campaigns cancelled (terminal).
    pub cancelled_campaigns: u32,
    /// Outstanding committed funds across every Open campaign.
    pub outstanding_committed: i128,
    /// Total committed across the pool's lifetime (irrespective of state).
    pub lifetime_committed: i128,
    /// Total released to beneficiaries via `settle`.
    pub lifetime_settled: i128,
    /// Total returned to sponsors via `cancel`.
    pub lifetime_cancelled: i128,
    pub now: u64,
}

/// Aggregate coverage snapshot returned by `sponsorship_coverage_snapshot()`.
///
/// Uses pre-aggregated storage counters so callers get pool-level coverage
/// without iterating every campaign. `aggregate_coverage_bps` and
/// `total_remaining` are best-effort: without an on-chain list of campaign
/// targets they fall back to 0. Callers that need per-campaign detail should
/// use `campaign_coverage(id)` instead.
#[contracttype]
#[derive(Clone, Debug)]
pub struct SponsorshipCoverageSnapshot {
    pub configured: bool,
    /// Number of campaigns currently in `Open` state.
    pub open_campaign_count: u32,
    /// Sum of target_amount across all open campaigns (0 when not tracked).
    pub total_target: i128,
    /// Sum of committed_amount across open campaigns (from `OutstandingCommitted`).
    pub total_committed: i128,
    /// total_target − total_committed, floored at 0.
    pub total_remaining: i128,
    /// Coverage in basis points (0–10 000). 0 when total_target is unknown.
    pub aggregate_coverage_bps: u32,
    /// Ledger timestamp at the time this snapshot was taken.
    pub now: u64,
}

/// Coverage view for a single campaign returned by `campaign_coverage(id)`.
///
/// `coverage_bps` is integer basis points (10_000 = 100%) so the frontend
/// doesn't need floating point. Capped at 10_000 once the campaign is fully
/// funded.
#[contracttype]
#[derive(Clone, Debug)]
pub struct CampaignCoverage {
    pub campaign_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub status: CampaignStatus,
    pub target_amount: i128,
    pub committed_amount: i128,
    pub remaining_amount: i128,
    pub coverage_bps: u32,
    pub now: u64,
}
