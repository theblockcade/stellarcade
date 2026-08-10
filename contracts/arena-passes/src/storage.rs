use soroban_sdk::{symbol_short, Address, Env, Symbol, Vec};

use crate::types::PassHolder;

const ADMIN: Symbol = symbol_short!("admin");
const HOLDERS: Symbol = symbol_short!("holders");

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&ADMIN, admin);
}
pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&ADMIN)
}
pub fn set_holders(env: &Env, holders: &Vec<PassHolder>) {
    env.storage().instance().set(&HOLDERS, holders);
}
pub fn get_holders(env: &Env) -> Vec<PassHolder> {
    env.storage()
        .instance()
        .get(&HOLDERS)
        .unwrap_or_else(|| Vec::new(env))
}
