use soroban_sdk::{Address, BytesN, Env};

use crate::{
    types::{Bounty, Claim, Config},
    DataKey, Error, TTL_BUMP, TTL_THRESHOLD,
};

pub fn config(env: &Env) -> Result<Config, Error> {
    let key = DataKey::Config;
    let storage = env.storage().instance();
    let value = storage.get(&key).ok_or(Error::NotInitialized)?;
    storage.extend_ttl(TTL_THRESHOLD, TTL_BUMP);
    Ok(value)
}

pub fn set_config(env: &Env, value: &Config) {
    let key = DataKey::Config;
    let storage = env.storage().instance();
    storage.set(&key, value);
    storage.extend_ttl(TTL_THRESHOLD, TTL_BUMP);
}

pub fn next_bounty_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextBountyId)
        .unwrap_or(1)
}

pub fn set_next_bounty_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextBountyId, &id);
}

pub fn bounty(env: &Env, id: u64) -> Result<Bounty, Error> {
    let key = DataKey::Bounty(id);
    let storage = env.storage().persistent();
    let value = storage.get(&key).ok_or(Error::BountyNotFound)?;
    storage.extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
    Ok(value)
}

pub fn set_bounty(env: &Env, value: &Bounty) {
    let key = DataKey::Bounty(value.id);
    let storage = env.storage().persistent();
    storage.set(&key, value);
    storage.extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
}

pub fn claim(env: &Env, bounty_id: u64, claim_id: u64) -> Result<Claim, Error> {
    let key = DataKey::Claim(bounty_id, claim_id);
    let storage = env.storage().persistent();
    let value = storage.get(&key).ok_or(Error::ClaimNotFound)?;
    storage.extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
    Ok(value)
}

pub fn set_claim(env: &Env, value: &Claim) {
    let key = DataKey::Claim(value.bounty_id, value.id);
    let storage = env.storage().persistent();
    storage.set(&key, value);
    storage.extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
}

pub fn proof_was_used(env: &Env, proof_hash: &BytesN<32>) -> bool {
    let key = DataKey::Proof(proof_hash.clone());
    let storage = env.storage().persistent();
    let used = storage.has(&key);
    if used {
        storage.extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
    }
    used
}

pub fn mark_proof_used(env: &Env, proof_hash: &BytesN<32>) {
    let key = DataKey::Proof(proof_hash.clone());
    let storage = env.storage().persistent();
    storage.set(&key, &true);
    storage.extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
}

pub fn oracle_is_configured(config: &Config, address: &Address) -> bool {
    config.oracles.iter().any(|oracle| oracle == *address)
}
