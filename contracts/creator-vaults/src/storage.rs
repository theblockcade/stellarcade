use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::Vault;

#[contracttype]
pub enum DataKey {
    Vault(Address),
    /// Index of every creator that has ever opened a vault.
    Owners,
    /// Running aggregate of all currently-locked funds.
    TotalLocked,
}

pub fn get_vault(env: &Env, creator: Address) -> Option<Vault> {
    env.storage().persistent().get(&DataKey::Vault(creator))
}

pub fn set_vault(env: &Env, creator: Address, vault: &Vault) {
    env.storage()
        .persistent()
        .set(&DataKey::Vault(creator), vault);
}

pub fn get_owners(env: &Env) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::Owners)
        .unwrap_or_else(|| Vec::new(env))
}

pub fn set_owners(env: &Env, owners: &Vec<Address>) {
    env.storage().persistent().set(&DataKey::Owners, owners);
}

pub fn get_total_locked(env: &Env) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::TotalLocked)
        .unwrap_or(0)
}

pub fn set_total_locked(env: &Env, total: i128) {
    env.storage().persistent().set(&DataKey::TotalLocked, &total);
}
