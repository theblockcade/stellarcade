use soroban_sdk::contracttype;

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ClaimWindowState {
    NotConfigured,
    Missing,
    Scheduled,
    Open,
    Closed,
    Paused,
}

/// Storage-backed campaign accounting used by the window and exhaustion reads.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignRecord {
    pub campaign_id: u64,
    pub budget: i128,
    pub committed_budget: i128,
    pub claimed_budget: i128,
    pub remaining_budget: i128,
    pub starts_at: u64,
    pub ends_at: u64,
    pub paused: bool,
    pub pending_claimants: u32,
    pub total_claims: u32,
}

/// Read model for frontend window banners and backend polling.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimWindowSummary {
    pub campaign_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: ClaimWindowState,
    pub now: u64,
    pub starts_at: u64,
    pub ends_at: u64,
    pub budget: i128,
    pub remaining_budget: i128,
    pub pending_claimants: u32,
    pub total_claims: u32,
}

/// Read model describing how close a campaign budget is to full exhaustion.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BudgetExhaustion {
    pub campaign_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: ClaimWindowState,
    pub paused: bool,
    pub budget: i128,
    pub committed_budget: i128,
    pub claimed_budget: i128,
    pub remaining_budget: i128,
    pub exhaustion_bps: u32,
    pub can_record_claims: bool,
}

/// Campaign budget saturation read model.
///
/// `saturation_bps` is floored basis-point math:
/// `committed_budget * 10_000 / budget`. Missing and unconfigured campaigns
/// return zero balances and `saturation_bps = 0`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimSaturationSummary {
    pub campaign_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: ClaimWindowState,
    pub paused: bool,
    pub budget: i128,
    pub committed_budget: i128,
    pub claimed_budget: i128,
    pub remaining_budget: i128,
    pub pending_claimants: u32,
    pub total_claims: u32,
    pub saturation_bps: u32,
    pub saturated: bool,
}

/// Cooldown and timing read model for a campaign claim window.
///
/// `seconds_until_open` is non-zero only before `starts_at`.
/// `seconds_until_closed` is non-zero only while the window is open.
/// Missing and unconfigured campaigns return zero timestamps and durations.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CooldownWindowAccessor {
    pub campaign_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: ClaimWindowState,
    pub now: u64,
    pub starts_at: u64,
    pub ends_at: u64,
    pub seconds_until_open: u64,
    pub seconds_until_closed: u64,
    pub can_record_claims: bool,
}
