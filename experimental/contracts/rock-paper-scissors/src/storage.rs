//! Storage keys and access helpers for the rock-paper-scissors contract.

use soroban_sdk::{contracttype, Address, Env};

use crate::types::{Match, MatchResult, MoveCommit};

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Token,
    FeeBps,
    NextMatchId,
    Match(u64),
    /// A player's move commitment for a match.
    Commit(u64, Address),
    Result(u64),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_token(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Token)
}

pub fn write_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn read_fee_bps(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0)
}

pub fn write_fee_bps(env: &Env, fee_bps: u32) {
    env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
}

pub fn next_match_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextMatchId)
        .unwrap_or(0);
    env.storage()
        .instance()
        .set(&DataKey::NextMatchId, &(id + 1));
    id
}

pub fn read_match(env: &Env, match_id: u64) -> Option<Match> {
    env.storage().persistent().get(&DataKey::Match(match_id))
}

pub fn write_match(env: &Env, m: &Match) {
    let key = DataKey::Match(m.id);
    env.storage().persistent().set(&key, m);
    extend(env, &key);
}

pub fn read_commit(env: &Env, match_id: u64, player: &Address) -> Option<MoveCommit> {
    env.storage()
        .persistent()
        .get(&DataKey::Commit(match_id, player.clone()))
}

pub fn write_commit(env: &Env, match_id: u64, player: &Address, commit: &MoveCommit) {
    let key = DataKey::Commit(match_id, player.clone());
    env.storage().persistent().set(&key, commit);
    extend(env, &key);
}

pub fn read_result(env: &Env, match_id: u64) -> Option<MatchResult> {
    env.storage().persistent().get(&DataKey::Result(match_id))
}

pub fn write_result(env: &Env, result: &MatchResult) {
    let key = DataKey::Result(result.match_id);
    env.storage().persistent().set(&key, result);
    extend(env, &key);
}
