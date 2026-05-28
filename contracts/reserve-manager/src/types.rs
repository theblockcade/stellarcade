use soroban_sdk::{contracttype, Address, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReserveStatus {
    Healthy = 0,
    BelowTarget = 1,
    Critical = 2,
    Paused = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ManagerConfig {
    pub admin: Address,
    pub treasury: Address,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReserveState {
    pub asset: Address,
    pub balance: i128,
    pub target_balance: i128,
    pub status: ReserveStatus,
    pub last_audit_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReserveSnapshot {
    pub config: Option<ManagerConfig>,
    pub reserves: Vec<ReserveState>,
    pub ledger: u32,
}
