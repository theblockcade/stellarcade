use soroban_sdk::{Address, Env, Vec};

use crate::{
    types::BountyRecord,
    DataKey, BUMP_AMOUNT, LIFETIME_THRESHOLD,
};

// ── Persistent: individual bounty records ─────────────────────────────────────

pub fn get_bounty(env: &Env, bounty_id: u64) -> Option<BountyRecord> {
    let key = DataKey::Bounty(bounty_id);
    let val = env.storage().persistent().get(&key);
    if val.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    val
}

pub fn set_bounty(env: &Env, bounty: &BountyRecord) {
    let key = DataKey::Bounty(bounty.bounty_id);
    env.storage().persistent().set(&key, bounty);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}

// ── Instance: all-IDs aggregate ───────────────────────────────────────────────

pub fn get_all_ids(env: &Env) -> Vec<u64> {
    env.storage()
        .instance()
        .get(&DataKey::AllIds)
        .unwrap_or_else(|| Vec::new(env))
}

pub fn push_bounty_id(env: &Env, bounty_id: u64) {
    let mut ids = get_all_ids(env);
    ids.push_back(bounty_id);
    env.storage().instance().set(&DataKey::AllIds, &ids);
}

// ── Instance: poster index ────────────────────────────────────────────────────

pub fn get_poster_index(env: &Env, poster: &Address) -> Vec<u64> {
    env.storage()
        .instance()
        .get(&DataKey::PosterIndex(poster.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn push_poster_index(env: &Env, poster: &Address, bounty_id: u64) {
    let mut ids = get_poster_index(env, poster);
    ids.push_back(bounty_id);
    env.storage()
        .instance()
        .set(&DataKey::PosterIndex(poster.clone()), &ids);
}
