use soroban_sdk::{Address, Env};

use crate::{
    types::{CreatorEscrowConfig, CreatorEscrowEntry, CreatorEscrowTotals},
    DataKey, BUMP_AMOUNT, LIFETIME_THRESHOLD,
};

pub fn get_config(env: &Env, creator: &Address) -> Option<CreatorEscrowConfig> {
    let key = DataKey::Config(creator.clone());
    let value = env.storage().persistent().get(&key);
    if value.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    value
}

pub fn set_config(env: &Env, creator: &Address, config: &CreatorEscrowConfig) {
    let key = DataKey::Config(creator.clone());
    env.storage().persistent().set(&key, config);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}

pub fn get_totals(env: &Env, creator: &Address) -> CreatorEscrowTotals {
    let key = DataKey::Totals(creator.clone());
    let value = env.storage().persistent().get(&key);
    if value.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    value.unwrap_or(CreatorEscrowTotals {
        total_locked: 0,
        total_released: 0,
        pending_entry_count: 0,
    })
}

pub fn set_totals(env: &Env, creator: &Address, totals: &CreatorEscrowTotals) {
    let key = DataKey::Totals(creator.clone());
    env.storage().persistent().set(&key, totals);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}

pub fn get_next_entry_id(env: &Env, creator: &Address) -> u64 {
    let key = DataKey::NextEntryId(creator.clone());
    let value = env.storage().persistent().get(&key);
    if value.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    value.unwrap_or(0)
}

pub fn set_next_entry_id(env: &Env, creator: &Address, next_entry_id: u64) {
    let key = DataKey::NextEntryId(creator.clone());
    env.storage().persistent().set(&key, &next_entry_id);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}

pub fn get_entry(env: &Env, creator: &Address, entry_id: u64) -> Option<CreatorEscrowEntry> {
    let key = DataKey::Entry(creator.clone(), entry_id);
    let value = env.storage().persistent().get(&key);
    if value.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    value
}

pub fn set_entry(env: &Env, creator: &Address, entry: &CreatorEscrowEntry) {
    let key = DataKey::Entry(creator.clone(), entry.entry_id);
    env.storage().persistent().set(&key, entry);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}
