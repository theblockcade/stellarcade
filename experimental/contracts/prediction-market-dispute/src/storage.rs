use soroban_sdk::{Address, Env};

use crate::types::{DataKey, Error, MarketDispute};

pub fn require_initialized(env: &Env) -> Result<(), Error> {
    if !env.storage().instance().has(&DataKey::Admin) {
        return Err(Error::NotInitialized);
    }
    Ok(())
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn set_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn set_arbiter(env: &Env, arbiter: &Address) {
    env.storage().instance().set(&DataKey::Arbiter, arbiter);
}

pub fn get_arbiter(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Arbiter).unwrap()
}

pub fn save_market(env: &Env, market_id: u64, market: &MarketDispute) {
    env.storage()
        .persistent()
        .set(&DataKey::Market(market_id), market);
}

pub fn load_market(env: &Env, market_id: u64) -> Result<MarketDispute, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Market(market_id))
        .ok_or(Error::MarketNotFound)
}
