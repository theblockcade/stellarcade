use crate::types::BatchRecord;
use soroban_sdk::Env;

use crate::DataKey;

pub fn set_batch(env: &Env, record: &BatchRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Batch(record.batch_id), record);
}

pub fn get_batch(env: &Env, batch_id: u64) -> Option<BatchRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Batch(batch_id))
        .unwrap_or(None)
}

pub fn increment_total_batches(env: &Env) {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::TotalBatches)
        .unwrap_or(0u64);
    env.storage()
        .instance()
        .set(&DataKey::TotalBatches, &(current + 1));
}

pub fn get_total_batches(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::TotalBatches)
        .unwrap_or(0u64)
}

pub fn increment_completed_batches(env: &Env) {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::CompletedBatches)
        .unwrap_or(0u64);
    env.storage()
        .instance()
        .set(&DataKey::CompletedBatches, &(current + 1));
}

pub fn get_completed_batches(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::CompletedBatches)
        .unwrap_or(0u64)
}

pub fn increment_pending_batches(env: &Env) {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::PendingBatches)
        .unwrap_or(0u64);
    env.storage()
        .instance()
        .set(&DataKey::PendingBatches, &(current + 1));
}

pub fn decrement_pending_batches(env: &Env) {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::PendingBatches)
        .unwrap_or(0u64);
    if current > 0 {
        env.storage()
            .instance()
            .set(&DataKey::PendingBatches, &(current - 1));
    }
}

pub fn get_pending_batches(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::PendingBatches)
        .unwrap_or(0u64)
}

pub fn add_total_distributed(env: &Env, amount: i128) {
    let current: i128 = env
        .storage()
        .instance()
        .get(&DataKey::TotalDistributed)
        .unwrap_or(0i128);
    env.storage()
        .instance()
        .set(&DataKey::TotalDistributed, &(current + amount));
}

pub fn get_total_distributed(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalDistributed)
        .unwrap_or(0i128)
}

pub fn increment_failed_batches(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::FailedBatches)
        .unwrap_or(0u32);
    env.storage()
        .instance()
        .set(&DataKey::FailedBatches, &(current + 1));
}

pub fn get_failed_batches(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::FailedBatches)
        .unwrap_or(0u32)
}
