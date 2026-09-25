//! Storage accessor helpers for the Wheel of Fortune contract.

use soroban_sdk::{Address, Env};

use crate::types::{DataKey, Error, PERSISTENT_BUMP_LEDGERS};

pub fn require_initialized(env: &Env) -> Result<(), Error> {
    if !env.storage().instance().has(&DataKey::Admin) {
        return Err(Error::NotInitialized);
    }
    Ok(())
}

pub fn get_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)
}

pub fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin = get_admin(env)?;
    caller.require_auth();
    if caller != &admin {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

pub fn get_token(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Token)
        .expect("WheelOfFortune: token not set")
}

pub fn require_not_paused(env: &Env) -> Result<(), Error> {
    let paused: bool = env
        .storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false);
    if paused {
        return Err(Error::ContractPaused);
    }
    Ok(())
}

pub fn next_spin_id(env: &Env) -> u64 {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::SpinNonce)
        .unwrap_or(0);
    let next = current + 1;
    env.storage().instance().set(&DataKey::SpinNonce, &next);
    next
}

pub fn get_escrow_total(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::EscrowTotal)
        .unwrap_or(0)
}

pub fn set_escrow_total(env: &Env, value: i128) {
    env.storage().instance().set(&DataKey::EscrowTotal, &value);
}

pub fn get_house_reserve(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::HouseReserve)
        .unwrap_or(0)
}

pub fn set_house_reserve(env: &Env, value: i128) {
    env.storage().instance().set(&DataKey::HouseReserve, &value);
}

pub fn save_spin(env: &Env, spin: &crate::types::SpinRecord) {
    let key = DataKey::Spin(spin.spin_id);
    env.storage().persistent().set(&key, spin);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_spin(env: &Env, spin_id: u64) -> Result<crate::types::SpinRecord, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Spin(spin_id))
        .ok_or(Error::SpinNotFound)
}
