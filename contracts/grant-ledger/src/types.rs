use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Grant {
    pub id: u64,
    pub total_budget: i128,
    pub allocated: i128,
    pub remaining: i128,
    pub allocation_count: u32,
    pub is_active: bool,
}

/// Point-in-time view of a grant's allocation state.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllocationSnapshot {
    pub grant_exists: bool,
    pub total_budget: i128,
    pub allocated: i128,
    pub remaining: i128,
    pub allocation_count: u32,
}

/// Coarse risk band derived from how much of the budget has been allocated.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RiskLevel {
    /// Grant does not exist.
    Unknown,
    Low,
    Medium,
    High,
    Exhausted,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ExhaustionRisk {
    pub grant_exists: bool,
    pub remaining: i128,
    /// Utilization in basis points (allocated / total_budget * 10_000),
    /// integer floor. 10_000 == fully allocated.
    pub utilization_bps: u32,
    pub risk_level: RiskLevel,
}

/// Combined allocation snapshot and risk band in a single read, avoiding the
/// need for a client to call both `allocation_snapshot` and `exhaustion_risk`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GrantAllocationSummary {
    pub grant_exists: bool,
    pub is_active: bool,
    pub total_budget: i128,
    pub allocated: i128,
    pub remaining: i128,
    pub allocation_count: u32,
    pub utilization_bps: u32,
    pub risk_level: RiskLevel,
}

/// Projected window within which the grant will be fully allocated if
/// allocations continue at their current average rate.
///
/// When fewer than two allocations have occurred the rate cannot be estimated;
/// `has_estimate` will be false and all timing fields will be 0.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneWindow {
    pub grant_exists: bool,
    pub has_estimate: bool,
    pub avg_allocation_per_call: i128,
    pub calls_until_exhaustion: u32,
    pub remaining: i128,
}
