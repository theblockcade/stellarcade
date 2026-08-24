#![no_std]

use soroban_sdk::{contracttype, Address, Env};
use crate::types::Bounty;

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
        .unwrap_or(1)
}

pub fn increment_next_bounty_id(env: &Env) -> u64 {
    let next = get_next_bounty_id(env);
    env.storage()
        .instance()
        .set(&DataKey::NextBountyId, &(next + 1));
    next
}

pub fn get_bounty(env: &Env, id: u64) -> Option<Bounty> {
    env.storage().persistent().get(&DataKey::Bounty(id))
}

pub fn set_bounty(env: &Env, id: u64, bounty: &Bounty) {
    env.storage().persistent().set(&DataKey::Bounty(id), bounty);
}
