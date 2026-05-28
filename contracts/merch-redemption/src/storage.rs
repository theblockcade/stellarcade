use soroban_sdk::{Env, Symbol};

use crate::{types::ClaimWindowState, DataKey, BUMP_AMOUNT, LIFETIME_THRESHOLD};

pub fn get_claim_window(env: &Env, item_id: &Symbol) -> Option<ClaimWindowState> {
    let key = DataKey::ClaimWindow(item_id.clone());
    let result = env.storage().persistent().get(&key);
    if result.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    result
}

#[cfg(test)]
pub fn set_claim_window(env: &Env, item_id: &Symbol, state: &ClaimWindowState) {
    let key = DataKey::ClaimWindow(item_id.clone());
    env.storage().persistent().set(&key, state);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}
