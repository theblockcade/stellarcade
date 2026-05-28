use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PendingClaimSnapshot {
    pub user: Address,
    pub pending_amount: i128,
    pub is_paused: bool,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RolloverPressure {
    pub total_pressure: i128,
    pub active_users: u32,
    pub timestamp: u64,
}
