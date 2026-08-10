use soroban_sdk::{Address, Env, Vec};

use crate::{DataKey, GameData, PredictionEntry, PERSISTENT_BUMP_LEDGERS};

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn get_rng_contract(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::RngContract)
}

pub fn get_prize_pool_contract(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::PrizePoolContract)
}

pub fn get_balance_contract(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::BalanceContract)
}

pub fn get_game(env: &Env, game_id: u64) -> Option<GameData> {
    env.storage().persistent().get(&DataKey::Game(game_id))
}

pub fn set_game(env: &Env, game_id: u64, game: &GameData) {
    persist_set(env, DataKey::Game(game_id), game);
}

pub fn get_prediction(env: &Env, game_id: u64, player: &Address) -> Option<PredictionEntry> {
    env.storage()
        .persistent()
        .get(&DataKey::Prediction(game_id, player.clone()))
}

pub fn set_prediction(env: &Env, game_id: u64, player: &Address, entry: &PredictionEntry) {
    persist_set(env, DataKey::Prediction(game_id, player.clone()), entry);
}

pub fn player_has_predicted(env: &Env, game_id: u64, player: &Address) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Prediction(game_id, player.clone()))
}

pub fn get_players(env: &Env, game_id: u64) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::PlayerList(game_id))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn set_players(env: &Env, game_id: u64, players: &Vec<Address>) {
    persist_set(env, DataKey::PlayerList(game_id), players);
}

fn persist_set<V: soroban_sdk::IntoVal<Env, soroban_sdk::Val>>(env: &Env, key: DataKey, val: &V) {
    env.storage().persistent().set(&key, val);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}
