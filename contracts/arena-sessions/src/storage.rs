use soroban_sdk::{Address, Env};

use crate::{
    types::{ArenaSession, PlayerSessionStats},
    DataKey, BUMP_AMOUNT, LIFETIME_THRESHOLD,
};

pub fn get_next_session_id(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::NextSessionId).unwrap_or(0)
}

pub fn set_next_session_id(env: &Env, next_session_id: u64) {
    env.storage().instance().set(&DataKey::NextSessionId, &next_session_id);
}

pub fn get_session(env: &Env, session_id: u64) -> Option<ArenaSession> {
    let key = DataKey::Session(session_id);
    let value = env.storage().persistent().get(&key);
    if value.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    value
}

pub fn set_session(env: &Env, session: &ArenaSession) {
    let key = DataKey::Session(session.session_id);
    env.storage().persistent().set(&key, session);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}

pub fn get_player_stats(env: &Env, player: &Address) -> PlayerSessionStats {
    let key = DataKey::PlayerStats(player.clone());
    let value = env.storage().persistent().get(&key);
    if value.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    value.unwrap_or(PlayerSessionStats {
        total_started: 0,
        completed_count: 0,
        expired_count: 0,
        total_staked: 0,
    })
}

pub fn set_player_stats(env: &Env, player: &Address, stats: &PlayerSessionStats) {
    let key = DataKey::PlayerStats(player.clone());
    env.storage().persistent().set(&key, stats);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}

pub fn get_active_session_id(env: &Env, player: &Address) -> Option<u64> {
    let key = DataKey::ActiveSession(player.clone());
    let value = env.storage().persistent().get(&key);
    if value.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    value
}

pub fn set_active_session_id(env: &Env, player: &Address, session_id: u64) {
    let key = DataKey::ActiveSession(player.clone());
    env.storage().persistent().set(&key, &session_id);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}

pub fn clear_active_session_id(env: &Env, player: &Address) {
    let key = DataKey::ActiveSession(player.clone());
    env.storage().persistent().remove(&key);
}
