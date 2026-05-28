use soroban_sdk::{contracttype, Address, Env};

use crate::types::Perk;

#[contracttype]
pub enum DataKey {
    Perk(u64),
    Queued(u64, Address),
    Claimed(u64, Address),
}

pub fn get_perk(env: &Env, id: u64) -> Option<Perk> {
    env.storage().persistent().get(&DataKey::Perk(id))
}

pub fn set_perk(env: &Env, id: u64, perk: &Perk) {
    env.storage().persistent().set(&DataKey::Perk(id), perk);
}

pub fn is_queued(env: &Env, id: u64, user: Address) -> bool {
    env.storage().persistent().has(&DataKey::Queued(id, user))
}

pub fn mark_queued(env: &Env, id: u64, user: Address) {
    env.storage()
        .persistent()
        .set(&DataKey::Queued(id, user), &true);
}

pub fn has_claimed(env: &Env, id: u64, user: Address) -> bool {
    env.storage().persistent().has(&DataKey::Claimed(id, user))
}

pub fn mark_claimed(env: &Env, id: u64, user: Address) {
    env.storage()
        .persistent()
        .set(&DataKey::Claimed(id, user), &true);
}
