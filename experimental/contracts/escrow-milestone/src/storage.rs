use soroban_sdk::{symbol_short, Env};
use crate::types::EscrowSummary;

pub fn get_next_escrow_id(env: &Env) -> u64 {
    env.storage().persistent().get(&symbol_short!("next_id")).unwrap_or(1)
}

pub fn set_next_escrow_id(env: &Env, id: u64) {
    env.storage().persistent().set(&symbol_short!("next_id"), &id);
}

pub fn get_escrow(env: &Env, id: u64) -> Option<EscrowSummary> {
    env.storage().persistent().get(&(symbol_short!("escrow"), id))
}

pub fn set_escrow(env: &Env, escrow: &EscrowSummary) {
    env.storage().persistent().set(&(symbol_short!("escrow"), escrow.id), escrow);
}
