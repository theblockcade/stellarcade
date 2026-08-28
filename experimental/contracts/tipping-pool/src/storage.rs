//! Storage keys and access helpers for the tipping pool contract.

use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::TipRecord;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

/// Cap on how many recent tips are retained per creator, so the vector
/// stays bounded regardless of tip volume.
pub const MAX_RECENT_TIPS: u32 = 50;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    /// Platform fee in basis points, deducted from every tip.
    PlatformFeeBps,
    /// Accumulated withdrawable balance for a creator.
    CreatorBalance(Address),
    /// Recent tips received by a creator, most recent last.
    RecentTips(Address),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn read_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn read_platform_fee_bps(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::PlatformFeeBps)
        .unwrap()
}

pub fn read_creator_balance(env: &Env, creator: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::CreatorBalance(creator.clone()))
        .unwrap_or(0)
}

pub fn write_creator_balance(env: &Env, creator: &Address, balance: i128) {
    let key = DataKey::CreatorBalance(creator.clone());
    env.storage().persistent().set(&key, &balance);
    extend(env, &key);
}

pub fn read_recent_tips(env: &Env, creator: &Address) -> Vec<TipRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::RecentTips(creator.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn push_recent_tip(env: &Env, creator: &Address, record: TipRecord) {
    let mut tips = read_recent_tips(env, creator);
    if tips.len() >= MAX_RECENT_TIPS {
        tips.remove(0);
    }
    tips.push_back(record);
    let key = DataKey::RecentTips(creator.clone());
    env.storage().persistent().set(&key, &tips);
    extend(env, &key);
}
