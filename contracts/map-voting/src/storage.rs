use soroban_sdk::Env;

use crate::{DataKey, types::VotingRoundRecord};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_round(env: &Env, round_id: u32) -> Option<VotingRoundRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Round(round_id))
}

pub fn set_round(env: &Env, round_id: u32, record: &VotingRoundRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Round(round_id), record);
    env.storage().persistent().extend_ttl(
        &DataKey::Round(round_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
