use soroban_sdk::{contracttype, Env};
use crate::types::LobbyData;

#[contracttype]
pub enum DataKey {
    Admin,
    Lobby(u64),
}

pub fn get_admin(env: &Env) -> Option<soroban_sdk::Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &soroban_sdk::Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_lobby(env: &Env, lobby_id: u64) -> Option<LobbyData> {
    env.storage().persistent().get(&DataKey::Lobby(lobby_id))
}

pub fn set_lobby(env: &Env, lobby_id: u64, data: &LobbyData) {
    env.storage().persistent().set(&DataKey::Lobby(lobby_id), data);
}
