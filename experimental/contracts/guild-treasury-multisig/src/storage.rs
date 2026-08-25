use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::ProposalRecord;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Signers,
    Threshold,
    TimelockSec,
    NextProposalId,
    Proposal(u64),
}

pub fn set_treasury_config(env: &Env, signers: &Vec<Address>, threshold: u32, timelock_sec: u64) {
    env.storage().instance().set(&DataKey::Signers, signers);
    env.storage().instance().set(&DataKey::Threshold, &threshold);
    env.storage()
        .instance()
        .set(&DataKey::TimelockSec, &timelock_sec);
}

pub fn get_signers(env: &Env) -> Vec<Address> {
    env.storage()
        .instance()
        .get(&DataKey::Signers)
        .expect("treasury not initialized")
}

pub fn get_threshold(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::Threshold)
        .expect("treasury not initialized")
}

pub fn get_timelock_sec(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::TimelockSec)
        .expect("treasury not initialized")
}

pub fn is_signer(env: &Env, addr: &Address) -> bool {
    let signers = get_signers(env);
    signers.contains(addr)
}

pub fn get_next_proposal_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextProposalId)
        .unwrap_or(1u64)
}

pub fn set_next_proposal_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextProposalId, &id);
}

pub fn get_proposal(env: &Env, proposal_id: u64) -> Option<ProposalRecord> {
    env.storage().instance().get(&DataKey::Proposal(proposal_id))
}

pub fn set_proposal(env: &Env, record: &ProposalRecord) {
    env.storage()
        .instance()
        .set(&DataKey::Proposal(record.proposal_id), record);
}
