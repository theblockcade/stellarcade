use soroban_sdk::{symbol_short, Address, Env, Symbol};

use crate::types::BonusCycle;

const ADMIN: Symbol = symbol_short!("admin");
const PAUSED: Symbol = symbol_short!("paused");
const CYCLE: Symbol = symbol_short!("cycle");

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
pub fn set_cycle(env: &Env, cycle: &BonusCycle) {
    env.storage().instance().set(&CYCLE, cycle);
}
pub fn get_cycle(env: &Env) -> Option<BonusCycle> {
    env.storage().instance().get(&CYCLE)
}
