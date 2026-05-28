use soroban_sdk::Env;

use crate::{types::RoundData, DataKey};

pub fn get_round(env: &Env, round_id: u64) -> Option<RoundData> {
    env.storage().persistent().get(&DataKey::Round(round_id))
}

pub fn set_round(env: &Env, round: &RoundData) {
    env.storage()
        .persistent()
        .set(&DataKey::Round(round.round_id), round);
}
