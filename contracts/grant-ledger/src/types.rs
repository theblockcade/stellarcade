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
