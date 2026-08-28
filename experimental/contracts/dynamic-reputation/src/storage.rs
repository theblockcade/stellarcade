use soroban_sdk::{symbol_short, Address, Env};
use crate::types::ReputationSummary;

pub fn get_reputation(env: &Env, player: &Address) -> Option<ReputationSummary> {
    env.storage().persistent().get(&(symbol_short!("rep"), player))
}

pub fn set_reputation(env: &Env, summary: &ReputationSummary) {
    env.storage().persistent().set(&(symbol_short!("rep"), &summary.player), summary);
}
