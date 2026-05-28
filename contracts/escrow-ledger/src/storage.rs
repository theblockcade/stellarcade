use crate::types::EscrowRecord;
use soroban_sdk::Env;

use crate::DataKey;

pub fn set_escrow(env: &Env, record: &EscrowRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Escrow(record.escrow_id), record);
}

pub fn get_escrow(env: &Env, escrow_id: u64) -> Option<EscrowRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Escrow(escrow_id))
        .unwrap_or(None)
}

pub fn increment_next_id(env: &Env) {
    let next_id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextEscrowId)
        .unwrap_or(0u64);
    env.storage()
        .instance()
        .set(&DataKey::NextEscrowId, &(next_id + 1));
}

pub fn get_next_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextEscrowId)
        .unwrap_or(0u64)
}

pub fn add_total_escrowed(env: &Env, amount: i128) {
    let current: i128 = env
        .storage()
        .instance()
        .get(&DataKey::TotalEscrowed)
        .unwrap_or(0i128);
    env.storage()
        .instance()
        .set(&DataKey::TotalEscrowed, &(current + amount));
}

pub fn get_total_escrowed(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalEscrowed)
        .unwrap_or(0i128)
}

pub fn add_total_settled(env: &Env, amount: i128) {
    let current: i128 = env
        .storage()
        .instance()
        .get(&DataKey::TotalSettled)
        .unwrap_or(0i128);
    env.storage()
        .instance()
        .set(&DataKey::TotalSettled, &(current + amount));
}

pub fn get_total_settled(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalSettled)
        .unwrap_or(0i128)
}

pub fn increment_pending_count(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::PendingCount)
        .unwrap_or(0u32);
    env.storage()
        .instance()
        .set(&DataKey::PendingCount, &(current + 1));
}

pub fn decrement_pending_count(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::PendingCount)
        .unwrap_or(0u32);
    if current > 0 {
        env.storage()
            .instance()
            .set(&DataKey::PendingCount, &(current - 1));
    }
}

pub fn get_pending_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::PendingCount)
        .unwrap_or(0u32)
}

pub fn increment_settled_count(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::SettledCount)
        .unwrap_or(0u32);
    env.storage()
        .instance()
        .set(&DataKey::SettledCount, &(current + 1));
}

pub fn get_settled_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::SettledCount)
        .unwrap_or(0u32)
}
