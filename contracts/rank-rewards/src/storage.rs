use soroban_sdk::{Address, Env};

use crate::{
    types::{BracketConfig, PlayerRecord},
    DataKey,
};

pub fn get_bracket(env: &Env, bracket_id: u32) -> Option<BracketConfig> {
    env.storage().persistent().get(&DataKey::Bracket(bracket_id))
}

pub fn set_bracket(env: &Env, bracket: &BracketConfig) {
    env.storage()
        .persistent()
        .set(&DataKey::Bracket(bracket.bracket_id), bracket);
}

pub fn get_player(env: &Env, user: &Address) -> Option<PlayerRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Player(user.clone()))
}

pub fn set_player(env: &Env, user: &Address, player: &PlayerRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Player(user.clone()), player);
}
