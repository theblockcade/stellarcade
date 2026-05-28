use soroban_sdk::{vec, Env, Vec};

use crate::{types::LockRecord, DataKey};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_lock(env: &Env, lock_id: u64) -> Option<LockRecord> {
    env.storage().persistent().get(&DataKey::Lock(lock_id))
}

pub fn set_lock(env: &Env, lock: &LockRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Lock(lock.lock_id), lock);
    env.storage().persistent().extend_ttl(
        &DataKey::Lock(lock.lock_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_lock_ids(env: &Env) -> Vec<u64> {
    env.storage()
        .persistent()
        .get(&DataKey::LockIds)
        .unwrap_or_else(|| vec![env])
}

pub fn append_lock_id(env: &Env, lock_id: u64) {
    let mut ids = get_lock_ids(env);
    ids.push_back(lock_id);
    env.storage().persistent().set(&DataKey::LockIds, &ids);
    env.storage().persistent().extend_ttl(
        &DataKey::LockIds,
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn read_u32(env: &Env, key: &DataKey) -> u32 {
    env.storage().instance().get(key).unwrap_or(0)
}

pub fn write_u32(env: &Env, key: &DataKey, value: u32) {
    env.storage().instance().set(key, &value);
}

pub fn read_i128(env: &Env, key: &DataKey) -> i128 {
    env.storage().instance().get(key).unwrap_or(0)
}

pub fn write_i128(env: &Env, key: &DataKey, value: i128) {
    env.storage().instance().set(key, &value);
}
