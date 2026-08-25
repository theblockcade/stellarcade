use soroban_sdk::{contracttype, Address, Env};

use crate::types::{DisputeRecord, PlayerBond};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Bond(u64, Address),
    NextDisputeId,
    Dispute(u64),
}

pub fn get_bond(env: &Env, match_id: u64, player: &Address) -> Option<PlayerBond> {
    env.storage()
        .instance()
        .get(&DataKey::Bond(match_id, player.clone()))
}

pub fn set_bond(env: &Env, bond: &PlayerBond) {
    env.storage()
        .instance()
        .set(&DataKey::Bond(bond.match_id, bond.player.clone()), bond);
}

pub fn get_next_dispute_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextDisputeId)
        .unwrap_or(1u64)
}

pub fn set_next_dispute_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextDisputeId, &id);
}

pub fn get_dispute(env: &Env, dispute_id: u64) -> Option<DisputeRecord> {
    env.storage().instance().get(&DataKey::Dispute(dispute_id))
}

pub fn set_dispute(env: &Env, record: &DisputeRecord) {
    env.storage()
        .instance()
        .set(&DataKey::Dispute(record.dispute_id), record);
}
