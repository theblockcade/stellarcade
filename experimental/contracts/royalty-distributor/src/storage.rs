//! Storage keys and access helpers for the royalty distributor contract.

use soroban_sdk::{contracttype, Address, Env};

use crate::types::Split;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Auto-incrementing id for the next split to be created.
    NextSplitId,
    Split(u64),
    /// The token a given split is denominated in.
    Token(u64),
    /// Cumulative amount a recipient has claimed from a given split.
    Claimed(u64, Address),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn next_split_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextSplitId)
        .unwrap_or(0);
    env.storage()
        .instance()
        .set(&DataKey::NextSplitId, &(id + 1));
    id
}

pub fn read_split(env: &Env, split_id: u64) -> Option<Split> {
    env.storage().persistent().get(&DataKey::Split(split_id))
}

pub fn write_split(env: &Env, split_id: u64, split: &Split) {
    let key = DataKey::Split(split_id);
    env.storage().persistent().set(&key, split);
    extend(env, &key);
}

pub fn read_token(env: &Env, split_id: u64) -> Address {
    env.storage()
        .persistent()
        .get(&DataKey::Token(split_id))
        .unwrap()
}

pub fn write_token(env: &Env, split_id: u64, token: &Address) {
    let key = DataKey::Token(split_id);
    env.storage().persistent().set(&key, token);
    extend(env, &key);
}

pub fn read_claimed(env: &Env, split_id: u64, recipient: &Address) -> u128 {
    env.storage()
        .persistent()
        .get(&DataKey::Claimed(split_id, recipient.clone()))
        .unwrap_or(0)
}

pub fn write_claimed(env: &Env, split_id: u64, recipient: &Address, amount: u128) {
    let key = DataKey::Claimed(split_id, recipient.clone());
    env.storage().persistent().set(&key, &amount);
    extend(env, &key);
}
