use soroban_sdk::Env;

use crate::{types::EscrowRecord, DataKey};

pub fn get_escrow(env: &Env, escrow_id: u64) -> Option<EscrowRecord> {
    env.storage().persistent().get(&DataKey::Escrow(escrow_id))
}

pub fn set_escrow(env: &Env, escrow_id: u64, record: &EscrowRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Escrow(escrow_id), record);
}
