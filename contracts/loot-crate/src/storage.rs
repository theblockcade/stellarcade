use soroban_sdk::Env;

use crate::{types::CrateData, DataKey};

pub fn get_crate(env: &Env, crate_id: u64) -> Option<CrateData> {
    env.storage().persistent().get(&DataKey::Crate(crate_id))
}

pub fn set_crate(env: &Env, crate_data: &CrateData) {
    env.storage()
        .persistent()
        .set(&DataKey::Crate(crate_data.crate_id), crate_data);
}
