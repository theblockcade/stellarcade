#![no_std]

use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::*;

// Storage keys

#[contracttype]
pub enum DataKey {
    Admin,
    SeasonConfig(u64),
    UserRewards(Address),           // All rewards for a user
    SeasonRewards(u64),              // All rewards for a season
    ClaimQueue(u64),                 // Pending claims for a season
    RolloverBalance(u64),            // Rollover balance for a season
    UserClaimSummary(Address, u64),  // User's claim summary for a season
    CurrentSeason,
}

// Storage TTL constants
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

// Storage functions

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_current_season(env: &Env) -> Option<u64> {
    env.storage().instance().get(&DataKey::CurrentSeason)
}

pub fn set_current_season(env: &Env, season_id: u64) {
    env.storage().instance().set(&DataKey::CurrentSeason, &season_id);
}

pub fn get_season_config(env: &Env, season_id: u64) -> Option<SeasonConfig> {
    env.storage().persistent().get(&DataKey::SeasonConfig(season_id))
}

pub fn set_season_config(env: &Env, season_id: u64, config: &SeasonConfig) {
    env.storage().persistent().set(&DataKey::SeasonConfig(season_id), config);
    env.storage().persistent().extend_ttl(
        &DataKey::SeasonConfig(season_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_user_rewards(env: &Env, user: &Address) -> Vec<SeasonReward> {
    env.storage()
        .persistent()
        .get(&DataKey::UserRewards(user.clone()))
        .unwrap_or(Vec::new(env))
}

pub fn set_user_rewards(env: &Env, user: &Address, rewards: &Vec<SeasonReward>) {
    env.storage().persistent().set(&DataKey::UserRewards(user.clone()), rewards);
    env.storage().persistent().extend_ttl(
        &DataKey::UserRewards(user.clone()),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn add_user_reward(env: &Env, user: &Address, reward: &SeasonReward) {
    let mut rewards = get_user_rewards(env, user);
    rewards.push_back(reward.clone());
    set_user_rewards(env, user, &rewards);
}

pub fn get_season_rewards(env: &Env, season_id: u64) -> Vec<SeasonReward> {
    env.storage()
        .persistent()
        .get(&DataKey::SeasonRewards(season_id))
        .unwrap_or(Vec::new(env))
}

pub fn set_season_rewards(env: &Env, season_id: u64, rewards: &Vec<SeasonReward>) {
    env.storage().persistent().set(&DataKey::SeasonRewards(season_id), rewards);
    env.storage().persistent().extend_ttl(
        &DataKey::SeasonRewards(season_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_claim_queue(env: &Env, season_id: u64) -> Vec<SeasonReward> {
    env.storage()
        .persistent()
        .get(&DataKey::ClaimQueue(season_id))
        .unwrap_or(Vec::new(env))
}

pub fn set_claim_queue(env: &Env, season_id: u64, queue: &Vec<SeasonReward>) {
    env.storage().persistent().set(&DataKey::ClaimQueue(season_id), queue);
    env.storage().persistent().extend_ttl(
        &DataKey::ClaimQueue(season_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn add_to_claim_queue(env: &Env, season_id: u64, reward: &SeasonReward) {
    let mut queue = get_claim_queue(env, season_id);
    queue.push_back(reward.clone());
    set_claim_queue(env, season_id, &queue);
}

pub fn remove_from_claim_queue(env: &Env, season_id: u64, index: usize) -> Option<SeasonReward> {
    let mut queue = get_claim_queue(env, season_id);
    if index >= queue.len() as usize {
        return None;
    }
    
    let removed = queue.remove_at(index);
    set_claim_queue(env, season_id, &queue);
    Some(removed)
}

pub fn get_rollover_balance(env: &Env, season_id: u64) -> Option<RolloverBalance> {
    env.storage().persistent().get(&DataKey::RolloverBalance(season_id))
}

pub fn set_rollover_balance(env: &Env, season_id: u64, balance: &RolloverBalance) {
    env.storage().persistent().set(&DataKey::RolloverBalance(season_id), balance);
    env.storage().persistent().extend_ttl(
        &DataKey::RolloverBalance(season_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_user_claim_summary(env: &Env, user: &Address, season_id: u64) -> Option<UserClaimSummary> {
    env.storage().persistent().get(&DataKey::UserClaimSummary(user.clone(), season_id))
}

pub fn set_user_claim_summary(env: &Env, user: &Address, season_id: u64, summary: &UserClaimSummary) {
    env.storage().persistent().set(&DataKey::UserClaimSummary(user.clone(), season_id), summary);
    env.storage().persistent().extend_ttl(
        &DataKey::UserClaimSummary(user.clone(), season_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
