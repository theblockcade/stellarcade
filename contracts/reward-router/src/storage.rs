use soroban_sdk::{contracttype, Env, Symbol};
use crate::types::{RouteData, FallbackBucket};

#[contracttype]
pub enum DataKey {
    Admin,
    Route(Symbol),
    Fallback,
}

pub fn get_admin(env: &Env) -> Option<soroban_sdk::Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &soroban_sdk::Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_route(env: &Env, route_id: &Symbol) -> Option<RouteData> {
    env.storage().persistent().get(&DataKey::Route(route_id.clone()))
}

pub fn set_route(env: &Env, route_id: &Symbol, data: &RouteData) {
    env.storage().persistent().set(&DataKey::Route(route_id.clone()), data);
}

pub fn get_fallback(env: &Env) -> Option<FallbackBucket> {
    env.storage().instance().get(&DataKey::Fallback)
}

pub fn set_fallback(env: &Env, data: &FallbackBucket) {
    env.storage().instance().set(&DataKey::Fallback, data);
}
