use soroban_sdk::Env;

use crate::{types::ShieldRecord, DataKey};

pub fn get_shield(env: &Env, shield_id: u64) -> Option<ShieldRecord> {
    env.storage().persistent().get(&DataKey::Shield(shield_id))
}

pub fn set_shield(env: &Env, shield: &ShieldRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Shield(shield.shield_id), shield);
}
