use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RedemptionStatus {
    Eligible = 0,
    Redeemed = 1,
    Expired = 2,
    NotStarted = 3,
    Paused = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RedeemerConfig {
    pub admin: Address,
    pub quest_board: Address,
    pub token: Address,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RedemptionSnapshot {
    pub config: Option<RedeemerConfig>,
    pub status: RedemptionStatus,
    pub user: Address,
    pub quest_id: u32,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RewardGap {
    pub config: Option<RedeemerConfig>,
    pub status: RedemptionStatus,
    pub user: Address,
    pub quest_id: u32,
    pub reward_gap: u32,
    pub ready_to_turn_in: bool,
    pub timestamp: u64,
}
