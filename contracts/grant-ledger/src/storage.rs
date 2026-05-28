use soroban_sdk::{contracttype, Env};

use crate::types::Grant;

#[contracttype]
pub enum DataKey {
    Grant(u64),
}

pub fn get_grant(env: &Env, id: u64) -> Option<Grant> {
    env.storage().persistent().get(&DataKey::Grant(id))
}

pub fn set_grant(env: &Env, id: u64, grant: &Grant) {
    env.storage().persistent().set(&DataKey::Grant(id), grant);
}
