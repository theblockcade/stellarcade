use soroban_sdk::{contracttype, Address, Env};

use crate::types::Mission;

#[contracttype]
pub enum DataKey {
    Mission(u64),
    /// Records the window_start in which a participant was last counted, so
    /// unique participants can be tracked per window without clearing state.
    Participant(u64, Address),
}

pub fn get_mission(env: &Env, id: u64) -> Option<Mission> {
    env.storage().persistent().get(&DataKey::Mission(id))
}

pub fn set_mission(env: &Env, id: u64, mission: &Mission) {
    env.storage().persistent().set(&DataKey::Mission(id), mission);
}

pub fn get_participant_window(env: &Env, id: u64, user: Address) -> Option<u64> {
    env.storage()
        .persistent()
        .get(&DataKey::Participant(id, user))
}

pub fn set_participant_window(env: &Env, id: u64, user: Address, window_start: u64) {
    env.storage()
        .persistent()
        .set(&DataKey::Participant(id, user), &window_start);
}
