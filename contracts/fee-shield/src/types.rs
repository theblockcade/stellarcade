use soroban_sdk::contracttype;

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ShieldState {
    NotConfigured,
    Missing,
    Protected,
    Depleted,
    Paused,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum DepletionRiskLevel {
    None,
    Low,
    Medium,
    High,
    Critical,
}

/// Storage-backed state reused by both read accessors.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ShieldRecord {
    pub shield_id: u64,
    pub protected_balance: i128,
    pub current_balance: i128,
    pub cumulative_fees_charged: i128,
    pub charge_count: u32,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProtectedBalanceSummary {
    pub shield_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: ShieldState,
    pub protected_balance: i128,
    pub current_balance: i128,
    pub spendable_balance: i128,
    pub cumulative_fees_charged: i128,
    pub charge_count: u32,
    pub can_charge: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DepletionRisk {
    pub shield_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub paused: bool,
    pub protected_balance: i128,
    pub current_balance: i128,
    pub spendable_balance: i128,
    pub spendable_bps: u32,
    pub risk_level: DepletionRiskLevel,
    pub will_block_next_charge: bool,
}
