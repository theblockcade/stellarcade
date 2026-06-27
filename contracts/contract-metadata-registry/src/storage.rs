use soroban_sdk::{Address, Env, Vec};

use crate::{DataKey, MetadataRecord, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_THRESHOLD};

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_metadata(env: &Env, contract_id: &Address) -> Option<MetadataRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Metadata(contract_id.clone()))
}

pub fn set_metadata(env: &Env, contract_id: &Address, record: &MetadataRecord) {
    let key = DataKey::Metadata(contract_id.clone());
    env.storage().persistent().set(&key, record);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_BUMP_LEDGERS);
}

pub fn set_metadata_history(
    env: &Env,
    contract_id: &Address,
    version: u32,
    record: &MetadataRecord,
) {
    let key = DataKey::History(contract_id.clone(), version);
    env.storage().persistent().set(&key, record);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_BUMP_LEDGERS);
}

pub fn is_registered(env: &Env, contract_id: &Address) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Metadata(contract_id.clone()))
}

pub fn add_to_registry_list(env: &Env, contract_id: &Address) {
    let mut list: Vec<Address> = env
        .storage()
        .persistent()
        .get(&DataKey::RegisteredContracts)
        .unwrap_or_else(|| Vec::new(env));

    let mut found = false;
    for c in list.iter() {
        if c == *contract_id {
            found = true;
            break;
        }
    }
    if !found {
        list.push_back(contract_id.clone());
        env.storage()
            .persistent()
            .set(&DataKey::RegisteredContracts, &list);
    }
}

pub fn get_registered_contracts(env: &Env) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::RegisteredContracts)
        .unwrap_or_else(|| Vec::new(env))
}

pub fn get_registered_count(env: &Env) -> u32 {
    get_registered_contracts(env).len()
}
