//! Storage keys and access helpers for the flash tournament contract.

use soroban_sdk::{contracttype, Env};

use crate::types::FlashLobby;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextLobbyId,
    Lobby(u64),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_next_lobby_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextLobbyId)
        .unwrap_or(1u64)
}

pub fn set_next_lobby_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextLobbyId, &id);
}

pub fn get_lobby(env: &Env, lobby_id: u64) -> Option<FlashLobby> {
    env.storage().persistent().get(&DataKey::Lobby(lobby_id))
}

pub fn set_lobby(env: &Env, lobby: &FlashLobby) {
    let key = DataKey::Lobby(lobby.lobby_id);
    env.storage().persistent().set(&key, lobby);
    extend(env, &key);
}
