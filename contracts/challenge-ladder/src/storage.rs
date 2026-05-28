use soroban_sdk::Env;

use crate::{DataKey, BracketData, BracketHealthData};

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn get_bracket_data(env: &Env, bracket_id: u32) -> Option<BracketData> {
    env.storage().instance().get(&DataKey::Bracket(bracket_id))
}

pub fn get_bracket_health_data(env: &Env, bracket_id: u32) -> Option<BracketHealthData> {
    env.storage().instance().get(&DataKey::BracketHealth(bracket_id))
}