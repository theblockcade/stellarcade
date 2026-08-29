use soroban_sdk::{contracttype, Env};

use crate::types::TokenStream;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextStreamId,
    Stream(u64),
}

pub fn get_next_stream_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextStreamId)
        .unwrap_or(1u64)
}

pub fn set_next_stream_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextStreamId, &id);
}

pub fn get_stream(env: &Env, stream_id: u64) -> Option<TokenStream> {
    env.storage().instance().get(&DataKey::Stream(stream_id))
}

pub fn set_stream(env: &Env, stream: &TokenStream) {
    env.storage()
        .instance()
        .set(&DataKey::Stream(stream.stream_id), stream);
}
