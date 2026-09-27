use soroban_sdk::{Address, Env};

use crate::types::{Bounty, Claim, DataKey, Error, PERSISTENT_BUMP_LEDGERS};

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Initialized)
}

pub fn require_initialized(env: &Env) -> Result<(), Error> {
    if !is_initialized(env) {
        return Err(Error::NotInitialized);
    }
    Ok(())
}

pub fn set_initialized(env: &Env) {
    env.storage().instance().set(&DataKey::Initialized, &true);
}

pub fn get_oracle(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Oracle).unwrap()
}

pub fn set_oracle(env: &Env, oracle: &Address) {
    env.storage().instance().set(&DataKey::Oracle, oracle);
}

pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn set_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn get_next_bounty_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextBountyId)
        .unwrap_or(1u64)
}

pub fn set_next_bounty_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextBountyId, &id);
}

pub fn set_bounty(env: &Env, bounty_id: u64, bounty: &Bounty) {
    let key = DataKey::Bounty(bounty_id);
    env.storage().persistent().set(&key, bounty);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_bounty(env: &Env, bounty_id: u64) -> Result<Bounty, Error> {
    let key = DataKey::Bounty(bounty_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::BountyNotFound)
}

pub fn set_claim(env: &Env, bounty_id: u64, claim: &Claim) {
    let key = DataKey::Claim(bounty_id);
    env.storage().persistent().set(&key, claim);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_claim(env: &Env, bounty_id: u64) -> Result<Claim, Error> {
    let key = DataKey::Claim(bounty_id);
    env.storage().persistent().get(&key).ok_or(Error::ClaimNotFound)
}

pub fn has_claim(env: &Env, bounty_id: u64) -> bool {
    let key = DataKey::Claim(bounty_id);
    env.storage().persistent().has(&key)
}
