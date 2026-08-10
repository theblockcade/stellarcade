use soroban_sdk::{symbol_short, Env, Symbol, Vec};

use crate::types::MemberPayout;

const ADMIN: Symbol = symbol_short!("admin");
const POOL: Symbol = symbol_short!("pool");
const MEMBERS: Symbol = symbol_short!("members");

pub fn set_admin(env: &Env, admin: &soroban_sdk::Address) {
    env.storage().instance().set(&ADMIN, admin);
}
pub fn get_admin(env: &Env) -> Option<soroban_sdk::Address> {
    env.storage().instance().get(&ADMIN)
}
pub fn set_pool(env: &Env, amount: i128) {
    env.storage().instance().set(&POOL, &amount);
}
pub fn get_pool(env: &Env) -> i128 {
    env.storage().instance().get(&POOL).unwrap_or(0)
}
pub fn set_members(env: &Env, members: &Vec<MemberPayout>) {
    env.storage().instance().set(&MEMBERS, members);
}
pub fn get_members(env: &Env) -> Vec<MemberPayout> {
    env.storage()
        .instance()
        .get(&MEMBERS)
        .unwrap_or_else(|| Vec::new(env))
}
