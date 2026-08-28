//! Storage keys and access helpers for the badge evolution contract.

use soroban_sdk::{contracttype, Address, Env};

use crate::types::{Badge, EvolutionRecipe};

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    NextTokenId,
    Recipe(u64),
    Badge(u64),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn write_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn read_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn write_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn next_token_id(env: &Env) -> u64 {
    let id = env
        .storage()
        .instance()
        .get(&DataKey::NextTokenId)
        .unwrap_or(0u64);
    env.storage()
        .instance()
        .set(&DataKey::NextTokenId, &(id + 1));
    id
}

pub fn read_recipe(env: &Env, recipe_id: u64) -> Option<EvolutionRecipe> {
    env.storage().persistent().get(&DataKey::Recipe(recipe_id))
}

pub fn write_recipe(env: &Env, recipe_id: u64, recipe: &EvolutionRecipe) {
    let key = DataKey::Recipe(recipe_id);
    env.storage().persistent().set(&key, recipe);
    extend(env, &key);
}

pub fn read_badge(env: &Env, token_id: u64) -> Option<Badge> {
    env.storage().persistent().get(&DataKey::Badge(token_id))
}

pub fn write_badge(env: &Env, token_id: u64, badge: &Badge) {
    let key = DataKey::Badge(token_id);
    env.storage().persistent().set(&key, badge);
    extend(env, &key);
}

pub fn remove_badge(env: &Env, token_id: u64) {
    env.storage().persistent().remove(&DataKey::Badge(token_id));
}
