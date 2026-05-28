use soroban_sdk::{symbol_short, Address, Env, Symbol};

const ADMIN: Symbol = symbol_short!("admin");
const PAUSED: Symbol = symbol_short!("paused");
const OPEN_COUNT: Symbol = symbol_short!("ocount");
const OLDEST: Symbol = symbol_short!("oldest");
const NEWEST: Symbol = symbol_short!("newest");
const DUEL_PREFIX: Symbol = symbol_short!("duel");

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&ADMIN, admin);
}
pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&ADMIN)
}
pub fn set_paused(env: &Env, paused: bool) {
    env.storage().instance().set(&PAUSED, &paused);
}
pub fn is_paused(env: &Env) -> bool {
    env.storage().instance().get(&PAUSED).unwrap_or(false)
}
pub fn set_open_count(env: &Env, count: u32) {
    env.storage().instance().set(&OPEN_COUNT, &count);
}
pub fn get_open_count(env: &Env) -> u32 {
    env.storage().instance().get(&OPEN_COUNT).unwrap_or(0)
}
pub fn set_oldest(env: &Env, id: u64) {
    env.storage().instance().set(&OLDEST, &id);
}
pub fn get_oldest(env: &Env) -> u64 {
    env.storage().instance().get(&OLDEST).unwrap_or(0)
}
pub fn set_newest(env: &Env, id: u64) {
    env.storage().instance().set(&NEWEST, &id);
}
pub fn get_newest(env: &Env) -> u64 {
    env.storage().instance().get(&NEWEST).unwrap_or(0)
}
pub fn set_duel_open(env: &Env, duel_id: u64, is_open: bool) {
    env.storage().persistent().set(&(DUEL_PREFIX, duel_id), &is_open);
}
pub fn get_duel_open(env: &Env, duel_id: u64) -> Option<bool> {
    env.storage().persistent().get(&(DUEL_PREFIX, duel_id))
}
