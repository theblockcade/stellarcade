//! Storage keys and access helpers for the tournament bracket contract.

use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::MatchupPair;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Next bracket id to be assigned.
    NextBracketId,
    BracketAdmin(u64),
    BracketPlayerCount(u64),
    BracketRoundCount(u64),
    BracketChampion(u64),
    /// All matchups in one round, ordered by match_idx.
    Round(u64, u32),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_next_bracket_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextBracketId)
        .unwrap_or(0)
}

pub fn write_next_bracket_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextBracketId, &id);
}

pub fn read_bracket_admin(env: &Env, bracket_id: u64) -> Option<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::BracketAdmin(bracket_id))
}

pub fn write_bracket_admin(env: &Env, bracket_id: u64, admin: &Address) {
    let key = DataKey::BracketAdmin(bracket_id);
    env.storage().persistent().set(&key, admin);
    extend(env, &key);
}

pub fn read_player_count(env: &Env, bracket_id: u64) -> u32 {
    env.storage()
        .persistent()
        .get(&DataKey::BracketPlayerCount(bracket_id))
        .unwrap_or(0)
}

pub fn write_player_count(env: &Env, bracket_id: u64, count: u32) {
    let key = DataKey::BracketPlayerCount(bracket_id);
    env.storage().persistent().set(&key, &count);
    extend(env, &key);
}

pub fn read_round_count(env: &Env, bracket_id: u64) -> u32 {
    env.storage()
        .persistent()
        .get(&DataKey::BracketRoundCount(bracket_id))
        .unwrap_or(0)
}

pub fn write_round_count(env: &Env, bracket_id: u64, count: u32) {
    let key = DataKey::BracketRoundCount(bracket_id);
    env.storage().persistent().set(&key, &count);
    extend(env, &key);
}

pub fn read_champion(env: &Env, bracket_id: u64) -> Option<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::BracketChampion(bracket_id))
}

pub fn write_champion(env: &Env, bracket_id: u64, champion: &Address) {
    let key = DataKey::BracketChampion(bracket_id);
    env.storage().persistent().set(&key, champion);
    extend(env, &key);
}

pub fn read_round(env: &Env, bracket_id: u64, round_idx: u32) -> Vec<MatchupPair> {
    env.storage()
        .persistent()
        .get(&DataKey::Round(bracket_id, round_idx))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn write_round(env: &Env, bracket_id: u64, round_idx: u32, matches: &Vec<MatchupPair>) {
    let key = DataKey::Round(bracket_id, round_idx);
    env.storage().persistent().set(&key, matches);
    extend(env, &key);
}
