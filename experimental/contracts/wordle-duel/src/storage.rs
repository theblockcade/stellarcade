use soroban_sdk::{contracttype, Env};

use crate::types::WordleDuel;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextDuelId,
    Duel(u64),
}

pub fn get_next_duel_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextDuelId)
        .unwrap_or(1u64)
}

pub fn set_next_duel_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextDuelId, &id);
}

pub fn get_duel(env: &Env, duel_id: u64) -> Option<WordleDuel> {
    env.storage().instance().get(&DataKey::Duel(duel_id))
}

pub fn set_duel(env: &Env, duel: &WordleDuel) {
    env.storage()
        .instance()
        .set(&DataKey::Duel(duel.duel_id), duel);
}
