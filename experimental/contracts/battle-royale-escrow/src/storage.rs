use soroban_sdk::{contracttype, Env};

use crate::types::BattleRoyaleMatch;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextMatchId,
    Match(u64),
}

pub fn get_next_match_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextMatchId)
        .unwrap_or(1u64)
}

pub fn set_next_match_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextMatchId, &id);
}

pub fn get_match(env: &Env, match_id: u64) -> Option<BattleRoyaleMatch> {
    env.storage().instance().get(&DataKey::Match(match_id))
}

pub fn set_match(env: &Env, m: &BattleRoyaleMatch) {
    env.storage().instance().set(&DataKey::Match(m.match_id), m);
}
