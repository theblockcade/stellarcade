use soroban_sdk::{Address, Env};

use crate::{
    types::{PerkCatalog, UserPerkState},
    DataKey, BUMP_AMOUNT, LIFETIME_THRESHOLD,
};

pub fn get_catalog(env: &Env) -> Option<PerkCatalog> {
    env.storage().instance().get(&DataKey::Catalog)
}

pub fn get_user_state(env: &Env, user: &Address) -> Option<UserPerkState> {
    let key = DataKey::UserState(user.clone());
    let state = env.storage().persistent().get(&key);
    if state.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    state
}

#[cfg(test)]
pub fn set_catalog(env: &Env, catalog: &PerkCatalog) {
    env.storage().instance().set(&DataKey::Catalog, catalog);
}

#[cfg(test)]
pub fn set_user_state(env: &Env, user: &Address, state: &UserPerkState) {
    let key = DataKey::UserState(user.clone());
    env.storage().persistent().set(&key, state);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}
