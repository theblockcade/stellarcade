use soroban_sdk::{contracttype, Address, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RewardStatus {
    Pending = 0,
    Claimed = 1,
    Cancelled = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RewardConfig {
    pub admin: Address,
    pub treasury: Address,
    pub token: Address,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserRewardState {
    pub user: Address,
    pub total_accrued: i128,
    pub total_claimed: i128,
    pub pending_balance: i128,
    pub last_update_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RewardSnapshot {
    pub config: Option<RewardConfig>,
    pub user_state: Option<UserRewardState>,
    pub timestamp: u64,
    pub ledger: u32,
}
