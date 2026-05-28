use soroban_sdk::{Address, Env};

use crate::{types::IdentityRecord, DataKey};

pub fn get_identity(env: &Env, identity: &Address) -> Option<IdentityRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Identity(identity.clone()))
}

pub fn set_identity(env: &Env, identity: &Address, record: &IdentityRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Identity(identity.clone()), record);
}
