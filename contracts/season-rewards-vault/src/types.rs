#![no_std]

use soroban_sdk::{contracttype, Address, Env, String, Vec};

// Types for season-rewards-vault contract

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeasonReward {
    pub season_id: u64,
    pub user: Address,
    pub amount: i128,
    pub reward_type: String,
    pub created_at: u64,
    pub expires_at: u64,
    pub is_claimed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimQueueSnapshot {
    pub season_id: u64,
    pub pending_claims: Vec<SeasonReward>,
    pub total_pending_amount: i128,
    pub queue_length: u32,
    pub oldest_claim_age: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RolloverBalance {
    pub season_id: u64,
    pub total_rollover_amount: i128,
    pub rollover_reason: String,
    pub last_rollover_at: u64,
    pub next_season_id: Option<u64>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeasonConfig {
    pub season_id: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub reward_pool: i128,
    pub is_active: bool,
    pub auto_rollover: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserClaimSummary {
    pub user: Address,
    pub season_id: u64,
    pub total_claimable: i128,
    pub claim_count: u32,
    pub oldest_unclaimed_age: u64,
}
