use crate::types::VaultClaim;
use crate::DataKey;
use soroban_sdk::Env;

pub fn set_claim(env: &Env, claim: &VaultClaim) {
    env.storage()
        .persistent()
        .set(&DataKey::Claim(claim.claim_id), claim);
}

pub fn get_claim(env: &Env, claim_id: u64) -> Option<VaultClaim> {
    env.storage().persistent().get(&DataKey::Claim(claim_id))
}

pub fn read_u32(env: &Env, key: &DataKey) -> u32 {
    env.storage().instance().get(key).unwrap_or(0)
}

pub fn read_i128(env: &Env, key: &DataKey) -> i128 {
    env.storage().instance().get(key).unwrap_or(0)
}

pub fn write_u32(env: &Env, key: &DataKey, value: u32) {
    env.storage().instance().set(key, &value);
}

pub fn write_i128(env: &Env, key: &DataKey, value: i128) {
    env.storage().instance().set(key, &value);
}
