use soroban_sdk::{Address, Env};

use crate::DataKey;

/// Return total tokens contributed this round (0 if not set).
pub fn get_total_contributed(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalContributed)
        .unwrap_or(0i128)
}

/// Persist total contributed amount.
pub fn set_total_contributed(env: &Env, amount: i128) {
    env.storage()
        .instance()
        .set(&DataKey::TotalContributed, &amount);
}

/// Return number of unique contributors this round (0 if not set).
pub fn get_contributor_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::ContributorCount)
        .unwrap_or(0u32)
}

/// Persist contributor count.
pub fn set_contributor_count(env: &Env, count: u32) {
    env.storage()
        .instance()
        .set(&DataKey::ContributorCount, &count);
}

/// Return the top contribution amount this round (0 if not set).
pub fn get_top_contribution(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TopContribution)
        .unwrap_or(0i128)
}

/// Persist top contribution amount.
pub fn set_top_contribution(env: &Env, amount: i128) {
    env.storage()
        .instance()
        .set(&DataKey::TopContribution, &amount);
}

/// Return the per-contributor amount for a given address (0 if not contributed).
pub fn get_contributor_amount(env: &Env, contributor: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::ContributorAmount(contributor.clone()))
        .unwrap_or(0i128)
}

/// Persist a per-contributor amount.
pub fn set_contributor_amount(env: &Env, contributor: &Address, amount: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::ContributorAmount(contributor.clone()), &amount);
}
