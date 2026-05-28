use soroban_sdk::{contracttype, symbol_short, Env, Symbol};

use crate::types::SeasonData;

const ACTIVE_SEASON: Symbol = symbol_short!("active");
const PAUSED: Symbol = symbol_short!("paused");
const ADMIN: Symbol = symbol_short!("admin");

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    ActiveSeason,
}

pub fn set_admin(env: &Env, admin: &soroban_sdk::Address) {
    env.storage().instance().set(&ADMIN, admin);
}

pub fn get_admin(env: &Env) -> Option<soroban_sdk::Address> {
    env.storage().instance().get(&ADMIN)
}

pub fn set_paused(env: &Env, paused: bool) {
    env.storage().instance().set(&PAUSED, &paused);
}

pub fn is_paused(env: &Env) -> bool {
    env.storage().instance().get(&PAUSED).unwrap_or(false)
}

pub fn set_active_season(env: &Env, data: &SeasonData) {
    env.storage().instance().set(&ACTIVE_SEASON, data);
}

pub fn get_active_season(env: &Env) -> Option<SeasonData> {
    env.storage().instance().get(&ACTIVE_SEASON)
}
