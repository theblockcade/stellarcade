//! Storage keys and access helpers for the prize escrow timelock contract.

use soroban_sdk::{contracttype, Address, Env};

use crate::types::QueuedPayout;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextPayoutId,
    Payout(u64),
    /// Whether `Address` is a registered arbiter allowed to freeze/resolve.
    Arbiter(Address),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_next_payout_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextPayoutId)
        .unwrap_or(1u64)
}

pub fn set_next_payout_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextPayoutId, &id);
}

pub fn get_payout(env: &Env, payout_id: u64) -> Option<QueuedPayout> {
    env.storage().persistent().get(&DataKey::Payout(payout_id))
}

pub fn set_payout(env: &Env, payout: &QueuedPayout) {
    let key = DataKey::Payout(payout.payout_id);
    env.storage().persistent().set(&key, payout);
    extend(env, &key);
}

pub fn is_arbiter(env: &Env, arbiter: &Address) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::Arbiter(arbiter.clone()))
        .unwrap_or(false)
}

pub fn set_arbiter(env: &Env, arbiter: &Address, enabled: bool) {
    env.storage()
        .instance()
        .set(&DataKey::Arbiter(arbiter.clone()), &enabled);
}
