use crate::types::LockRecord;
use soroban_sdk::Env;

use crate::DataKey;

pub fn set_lock(env: &Env, record: &LockRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Lock(record.lock_id), record);
}

pub fn get_lock(env: &Env, lock_id: u64) -> Option<LockRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Lock(lock_id))
        .unwrap_or(None)
}

pub fn add_total_locked_amount(env: &Env, amount: i128) {
    let current: i128 = env
        .storage()
        .instance()
        .get(&DataKey::TotalLockedAmount)
        .unwrap_or(0i128);
    env.storage()
        .instance()
        .set(&DataKey::TotalLockedAmount, &(current + amount));
}

pub fn get_total_locked_amount(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalLockedAmount)
        .unwrap_or(0i128)
}

pub fn increment_total_locks(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::TotalLocks)
        .unwrap_or(0u32);
    env.storage()
        .instance()
        .set(&DataKey::TotalLocks, &(current + 1));
}

pub fn get_total_locks(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::TotalLocks)
        .unwrap_or(0u32)
}

pub fn increment_short_locks(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::ShortLocks)
        .unwrap_or(0u32);
    env.storage()
        .instance()
        .set(&DataKey::ShortLocks, &(current + 1));
}

pub fn get_short_locks(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::ShortLocks)
        .unwrap_or(0u32)
}

pub fn increment_long_locks(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::LongLocks)
        .unwrap_or(0u32);
    env.storage()
        .instance()
        .set(&DataKey::LongLocks, &(current + 1));
}

pub fn get_long_locks(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::LongLocks)
        .unwrap_or(0u32)
}

pub fn add_unlocked_amount(env: &Env, amount: i128) {
    let current: i128 = env
        .storage()
        .instance()
        .get(&DataKey::UnlockedAmount)
        .unwrap_or(0i128);
    env.storage()
        .instance()
        .set(&DataKey::UnlockedAmount, &(current + amount));
}

pub fn get_unlocked_amount(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::UnlockedAmount)
        .unwrap_or(0i128)
}
