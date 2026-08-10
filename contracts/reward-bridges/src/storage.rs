use soroban_sdk::{symbol_short, Address, Env, Symbol, Vec};

use crate::types::BridgeEntry;

const ADMIN: Symbol = symbol_short!("admin");
const ENTRIES: Symbol = symbol_short!("entries");

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&ADMIN, admin);
}
pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&ADMIN)
}
pub fn set_entries(env: &Env, entries: &Vec<BridgeEntry>) {
    env.storage().instance().set(&ENTRIES, entries);
}
pub fn get_entries(env: &Env) -> Vec<BridgeEntry> {
    env.storage()
        .instance()
        .get(&ENTRIES)
        .unwrap_or_else(|| Vec::new(env))
}
