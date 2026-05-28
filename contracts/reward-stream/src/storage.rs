use soroban_sdk::{symbol_short, Address, Env, Symbol};

use crate::types::StreamData;

const ADMIN: Symbol = symbol_short!("admin");
const STREAM: Symbol = symbol_short!("stream");

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&ADMIN, admin);
}

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&ADMIN)
}

pub fn set_stream(env: &Env, stream: &StreamData) {
    env.storage().instance().set(&STREAM, stream);
}

pub fn get_stream(env: &Env) -> Option<StreamData> {
    env.storage().instance().get(&STREAM)
}
