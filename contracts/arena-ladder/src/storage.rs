use soroban_sdk::Env;

use crate::{DataKey, types::BracketRecord};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_bracket(env: &Env, bracket_id: u32) -> Option<BracketRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Bracket(bracket_id))
}

pub fn set_bracket(env: &Env, bracket_id: u32, record: &BracketRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Bracket(bracket_id), record);
    env.storage().persistent().extend_ttl(
        &DataKey::Bracket(bracket_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
