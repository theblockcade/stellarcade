use soroban_sdk::{contracttype, Env};

use crate::types::BountyRecord;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextBountyId,
    Bounty(u64),
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

pub fn get_bounty(env: &Env, bounty_id: u64) -> Option<BountyRecord> {
    env.storage().instance().get(&DataKey::Bounty(bounty_id))
}

pub fn set_bounty(env: &Env, record: &BountyRecord) {
    env.storage()
        .instance()
        .set(&DataKey::Bounty(record.bounty_id), record);
}
