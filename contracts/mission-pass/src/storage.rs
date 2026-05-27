use soroban_sdk::Env;

use crate::{DataKey, types::PassRecord};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_pass(env: &Env, pass_id: u32) -> Option<PassRecord> {
    env.storage().persistent().get(&DataKey::Pass(pass_id))
}

pub fn set_pass(env: &Env, pass_id: u32, record: &PassRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Pass(pass_id), record);
    env.storage().persistent().extend_ttl(
        &DataKey::Pass(pass_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
