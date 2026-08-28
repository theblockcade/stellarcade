use soroban_sdk::{symbol_short, Address, Env};
use crate::types::{MemberHolding, SyndicatePool};

pub fn get_next_syndicate_id(env: &Env) -> u64 {
    env.storage().persistent().get(&symbol_short!("next_id")).unwrap_or(1)
}

pub fn set_next_syndicate_id(env: &Env, id: u64) {
    env.storage().persistent().set(&symbol_short!("next_id"), &id);
}

pub fn get_syndicate(env: &Env, id: u64) -> Option<SyndicatePool> {
    env.storage().persistent().get(&(symbol_short!("synd"), id))
}

pub fn set_syndicate(env: &Env, pool: &SyndicatePool) {
    env.storage().persistent().set(&(symbol_short!("synd"), pool.id), pool);
}

pub fn get_member_holding(env: &Env, syndicate_id: u64, member: &Address) -> Option<MemberHolding> {
    env.storage().persistent().get(&(symbol_short!("hold"), syndicate_id, member))
}

pub fn set_member_holding(env: &Env, syndicate_id: u64, member: &Address, holding: &MemberHolding) {
    env.storage().persistent().set(&(symbol_short!("hold"), syndicate_id, member), holding);
}
