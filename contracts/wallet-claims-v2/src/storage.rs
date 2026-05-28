use soroban_sdk::{vec, Address, Env, Vec};

use crate::{
    types::{CooldownPolicy, WalletClaimRecord},
    DataKey,
};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_policy(env: &Env, wallet: &Address) -> Option<CooldownPolicy> {
    env.storage()
        .persistent()
        .get(&DataKey::Policy(wallet.clone()))
}

pub fn set_policy(env: &Env, wallet: &Address, policy: &CooldownPolicy) {
    env.storage()
        .persistent()
        .set(&DataKey::Policy(wallet.clone()), policy);
    env.storage().persistent().extend_ttl(
        &DataKey::Policy(wallet.clone()),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_claim(env: &Env, claim_id: u64) -> Option<WalletClaimRecord> {
    env.storage().persistent().get(&DataKey::Claim(claim_id))
}

pub fn set_claim(env: &Env, claim: &WalletClaimRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Claim(claim.claim_id), claim);
    env.storage().persistent().extend_ttl(
        &DataKey::Claim(claim.claim_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_claim_ids(env: &Env) -> Vec<u64> {
    env.storage()
        .persistent()
        .get(&DataKey::ClaimIds)
        .unwrap_or_else(|| vec![env])
}

pub fn append_claim_id(env: &Env, claim_id: u64) {
    let mut ids = get_claim_ids(env);
    ids.push_back(claim_id);
    env.storage().persistent().set(&DataKey::ClaimIds, &ids);
    env.storage().persistent().extend_ttl(
        &DataKey::ClaimIds,
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
