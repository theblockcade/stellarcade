use soroban_sdk::Env;

use crate::{types::DropRecord, DataKey};

pub fn get_drop(env: &Env, drop_id: u64) -> Option<DropRecord> {
    env.storage().persistent().get(&DataKey::Drop(drop_id))
}

pub fn set_drop(env: &Env, drop: &DropRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Drop(drop.drop_id), drop);
}
