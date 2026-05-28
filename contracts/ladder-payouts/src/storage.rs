use soroban_sdk::{contracttype, Env, Address};
use crate::types::Config;

#[contracttype]
pub enum DataKey {
    Config,
    PendingClaim(Address),
    RolloverPressure,
}

pub fn set_config(env: &Env, config: &Config) {
    env.storage().instance().set(&DataKey::Config, config);
}

pub fn get_config(env: &Env) -> Option<Config> {
    env.storage().instance().get(&DataKey::Config)
}

pub fn set_pending_claim(env: &Env, user: &Address, amount: i128) {
    env.storage().persistent().set(&DataKey::PendingClaim(user.clone()), &amount);
}

pub fn get_pending_claim(env: &Env, user: &Address) -> i128 {
    env.storage().persistent().get(&DataKey::PendingClaim(user.clone())).unwrap_or(0)
}

pub fn set_rollover_pressure(env: &Env, amount: i128) {
    env.storage().instance().set(&DataKey::RolloverPressure, &amount);
}

pub fn get_rollover_pressure(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::RolloverPressure).unwrap_or(0)
}
