use soroban_sdk::Env;
use crate::types::{DataKey, SafeguardConfig};

pub fn set_config(env: &Env, config: &SafeguardConfig) {
    env.storage().instance().set(&DataKey::Config, config);
}

pub fn get_config(env: &Env) -> Option<SafeguardConfig> {
    env.storage().instance().get(&DataKey::Config)
}

pub fn set_breach_count(env: &Env, count: u32) {
    env.storage().instance().set(&DataKey::BreachCount, &count);
}

pub fn get_breach_count(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::BreachCount).unwrap_or(0)
}

pub fn set_last_breach_time(env: &Env, time: u64) {
    env.storage().instance().set(&DataKey::LastBreachTime, &time);
}

pub fn get_last_breach_time(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::LastBreachTime).unwrap_or(0)
}

pub fn set_current_value(env: &Env, value: i128) {
    env.storage().instance().set(&DataKey::CurrentValue, &value);
}

pub fn get_current_value(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::CurrentValue).unwrap_or(0)
}

pub fn set_cooldown_end(env: &Env, time: u64) {
    env.storage().instance().set(&DataKey::CooldownEnd, &time);
}

pub fn get_cooldown_end(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::CooldownEnd).unwrap_or(0)
}
