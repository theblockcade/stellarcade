use soroban_sdk::Env;

use crate::{DataKey, types::StreamRecord};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_stream(env: &Env, stream_id: u32) -> Option<StreamRecord> {
    env.storage().persistent().get(&DataKey::Stream(stream_id))
}

pub fn set_stream(env: &Env, stream_id: u32, record: &StreamRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Stream(stream_id), record);
    env.storage().persistent().extend_ttl(
        &DataKey::Stream(stream_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
