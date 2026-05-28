use soroban_sdk::contracttype;

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum PoolState {
    NotConfigured,
    Missing,
    Active,
    Paused,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ClaimDelayState {
    /// The member has no claim record on file yet.
    NoRecord,
    /// The pool referenced by the member's record was deleted.
    MissingPool,
    /// The claim delay has not yet elapsed.
    Waiting,
    /// Claim is available — UI can show the claim button.
    Ready,
    /// Member already claimed — the pool credited them.
    AlreadyClaimed,
    /// Pool is paused; readers should suppress the claim affordance.
    Blocked,
}

/// Storage-backed team-prize pool.
///
/// `total_amount` is set once at upsert (and may be increased on subsequent
/// upserts by the admin). `claimed_amount` is the running total of paid
/// claims, kept in storage so the coverage view is O(1).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolConfig {
    pub pool_id: u32,
    pub total_amount: u128,
    pub claimed_amount: u128,
    pub eligible_member_count: u32,
    pub claimed_member_count: u32,
    pub claim_delay_secs: u64,
    pub paused: bool,
}

/// Per-member record, keyed by `(pool_id, member)`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MemberRecord {
    pub pool_id: u32,
    /// Ledger timestamp at which the member became eligible. The claim
    /// window opens at `eligible_at + claim_delay_secs`.
    pub eligible_at: u64,
    /// Per-member share — admin sets this when granting eligibility.
    pub share_amount: u128,
    pub claimed: bool,
}

/// Structured response for `prize_pool_coverage` (#783). `coverage_bps` is
/// the fraction of the pool that has been claimed, in basis points
/// (10_000 = 100%). Surfaced explicitly so the UI doesn't have to compute
/// it and risk rounding inconsistencies across renders.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PrizePoolCoverage {
    pub pool_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub state: PoolState,
    pub total_amount: u128,
    pub claimed_amount: u128,
    pub unclaimed_amount: u128,
    pub eligible_member_count: u32,
    pub claimed_member_count: u32,
    pub unclaimed_member_count: u32,
    pub coverage_bps: u32,
}

/// Structured response for `claim_delay_accessor` (#783).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimDelayInfo {
    pub configured: bool,
    pub member_found: bool,
    pub pool_found: bool,
    pub pool_id: u32,
    pub eligible_at: u64,
    pub claim_window_opens_at: u64,
    pub seconds_until_claim: u64,
    pub share_amount: u128,
    pub already_claimed: bool,
    pub pool_paused: bool,
    pub state: ClaimDelayState,
}
