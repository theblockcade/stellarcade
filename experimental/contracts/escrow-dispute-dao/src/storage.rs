use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::Dispute;

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextDisputeId,
    JurorStake(Address),
    StakedJurors,
    Dispute(u64),
    JurorStakeAmount,
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn next_dispute_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextDisputeId)
        .unwrap_or(0);
    env.storage()
        .instance()
        .set(&DataKey::NextDisputeId, &(id + 1));
    id
}

pub fn read_juror_stake(env: &Env, juror: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::JurorStake(juror.clone()))
        .unwrap_or(0)
}

pub fn write_juror_stake(env: &Env, juror: &Address, amount: i128) {
    let key = DataKey::JurorStake(juror.clone());
    env.storage().persistent().set(&key, &amount);
    extend(env, &key);
}

pub fn read_staked_jurors(env: &Env) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::StakedJurors)
        .unwrap_or_else(|| Vec::new(env))
}

pub fn write_staked_jurors(env: &Env, jurors: &Vec<Address>) {
    let key = DataKey::StakedJurors;
    env.storage().persistent().set(&key, jurors);
    extend(env, &key);
}

pub fn read_dispute(env: &Env, dispute_id: u64) -> Option<Dispute> {
    env.storage()
        .persistent()
        .get(&DataKey::Dispute(dispute_id))
}

pub fn write_dispute(env: &Env, dispute: &Dispute) {
    let key = DataKey::Dispute(dispute.dispute_id);
    env.storage().persistent().set(&key, dispute);
    extend(env, &key);
}
