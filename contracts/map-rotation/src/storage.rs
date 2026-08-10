use soroban_sdk::{Address, Env};

use crate::DataKey;

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}
