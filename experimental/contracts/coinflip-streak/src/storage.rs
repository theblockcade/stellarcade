use soroban_sdk::{contracttype, Env};

use crate::types::StreakState;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextStreakId,
    Streak(u64),
}

pub fn get_next_streak_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextStreakId)
        .unwrap_or(1u64)
}

pub fn set_next_streak_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextStreakId, &id);
}

pub fn get_streak(env: &Env, streak_id: u64) -> Option<StreakState> {
    env.storage().instance().get(&DataKey::Streak(streak_id))
}

pub fn set_streak(env: &Env, state: &StreakState) {
    env.storage()
        .instance()
        .set(&DataKey::Streak(state.streak_id), state);
}
