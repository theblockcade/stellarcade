//! Storage helpers for the clan treasury vault contract.

use soroban_sdk::{vec, Address, Env, Vec};

use crate::types::{DataKey, Error, Proposal, PERSISTENT_BUMP_LEDGERS};

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Leader)
}

pub fn require_initialized(env: &Env) -> Result<(), Error> {
    if !is_initialized(env) {
        return Err(Error::NotInitialized);
    }
    Ok(())
}

pub fn get_leader(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Leader).unwrap()
}

pub fn set_leader(env: &Env, leader: &Address) {
    env.storage().instance().set(&DataKey::Leader, leader);
}

pub fn get_officers(env: &Env) -> Vec<Address> {
    env.storage()
        .instance()
        .get(&DataKey::Officers)
        .unwrap_or_else(|| vec![env])
}

pub fn set_officers(env: &Env, officers: &Vec<Address>) {
    env.storage().instance().set(&DataKey::Officers, officers);
}

pub fn is_officer(env: &Env, addr: &Address) -> bool {
    get_officers(env).iter().any(|o| &o == addr)
}

pub fn get_threshold(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::Threshold).unwrap()
}

pub fn set_threshold(env: &Env, threshold: u32) {
    env.storage()
        .instance()
        .set(&DataKey::Threshold, &threshold);
}

pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn set_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn get_balance(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::Balance).unwrap_or(0)
}

pub fn set_balance(env: &Env, balance: i128) {
    env.storage().instance().set(&DataKey::Balance, &balance);
}

pub fn next_proposal_id(env: &Env) -> u64 {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::ProposalCount)
        .unwrap_or(0);
    let next = current + 1;
    env.storage().instance().set(&DataKey::ProposalCount, &next);
    next
}

pub fn get_proposal(env: &Env, id: u64) -> Result<Proposal, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Proposal(id))
        .ok_or(Error::ProposalNotFound)
}

pub fn set_proposal(env: &Env, proposal: &Proposal) {
    let key = DataKey::Proposal(proposal.id);
    env.storage().persistent().set(&key, proposal);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_votes(env: &Env, proposal_id: u64) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::Votes(proposal_id))
        .unwrap_or_else(|| vec![env])
}

pub fn set_votes(env: &Env, proposal_id: u64, votes: &Vec<Address>) {
    let key = DataKey::Votes(proposal_id);
    env.storage().persistent().set(&key, votes);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}
