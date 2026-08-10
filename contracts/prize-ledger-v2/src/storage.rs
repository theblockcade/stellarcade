use soroban_sdk::{contracttype, Env};

use crate::types::PrizeRecord;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Prize(u64),
    NextPrizeId,
    TotalLiability,
    TotalPaid,
    UnpaidCount,
    PaidCount,
}

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &soroban_sdk::Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_admin(env: &Env) -> Option<soroban_sdk::Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_prize(env: &Env, record: &PrizeRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Prize(record.prize_id), record);
}

pub fn get_prize(env: &Env, prize_id: u64) -> Option<PrizeRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Prize(prize_id))
        .unwrap_or(None)
}

pub fn get_next_prize_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextPrizeId)
        .unwrap_or(0u64)
}

pub fn set_next_prize_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextPrizeId, &id);
}

pub fn add_total_liability(env: &Env, amount: i128) {
    let current: i128 = env
        .storage()
        .instance()
        .get(&DataKey::TotalLiability)
        .unwrap_or(0i128);
    env.storage()
        .instance()
        .set(&DataKey::TotalLiability, &(current + amount));
}

pub fn get_total_liability(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalLiability)
        .unwrap_or(0i128)
}

pub fn add_total_paid(env: &Env, amount: i128) {
    let current: i128 = env
        .storage()
        .instance()
        .get(&DataKey::TotalPaid)
        .unwrap_or(0i128);
    env.storage()
        .instance()
        .set(&DataKey::TotalPaid, &(current + amount));
}

pub fn get_total_paid(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalPaid)
        .unwrap_or(0i128)
}

pub fn increment_unpaid_count(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::UnpaidCount)
        .unwrap_or(0u32);
    env.storage()
        .instance()
        .set(&DataKey::UnpaidCount, &(current + 1));
}

pub fn decrement_unpaid_count(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::UnpaidCount)
        .unwrap_or(0u32);
    if current > 0 {
        env.storage()
            .instance()
            .set(&DataKey::UnpaidCount, &(current - 1));
    }
}

pub fn get_unpaid_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::UnpaidCount)
        .unwrap_or(0u32)
}

pub fn increment_paid_count(env: &Env) {
    let current: u32 = env
        .storage()
        .instance()
        .get(&DataKey::PaidCount)
        .unwrap_or(0u32);
    env.storage()
        .instance()
        .set(&DataKey::PaidCount, &(current + 1));
}

pub fn get_paid_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::PaidCount)
        .unwrap_or(0u32)
}
