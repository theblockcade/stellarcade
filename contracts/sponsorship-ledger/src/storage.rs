use soroban_sdk::{contracttype, Address, Env};
use crate::types::{PartnerCommitment, ReleaseSchedule};

#[contracttype]
pub enum DataKey {
    Commitment(Address),
    Schedule(Address),
}

pub fn get_commitment(env: &Env, partner: Address) -> Option<PartnerCommitment> {
    env.storage().persistent().get(&DataKey::Commitment(partner))
}

pub fn set_commitment(env: &Env, partner: Address, commitment: &PartnerCommitment) {
    env.storage().persistent().set(&DataKey::Commitment(partner), commitment);
}

pub fn get_schedule(env: &Env, partner: Address) -> Option<ReleaseSchedule> {
    env.storage().persistent().get(&DataKey::Schedule(partner))
}

pub fn set_schedule(env: &Env, partner: Address, schedule: &ReleaseSchedule) {
    env.storage().persistent().set(&DataKey::Schedule(partner), schedule);
}
