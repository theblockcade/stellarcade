//! Storage keys and access helpers for the time-weighted faucet contract.

use soroban_sdk::{contracttype, Address, Env};

/// Extend instance/persistent entries roughly 30 days (assuming ~5s
/// ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Tokens dispensed per successful `request_drip` call.
    DripAmount,
    /// Cooldown (seconds) a recipient must wait between successful drips.
    CooldownSec,
    /// Maximum tokens dispensable within a single daily window.
    DailyCap,
    /// Tokens currently held in the faucet reserve.
    ReserveBalance,
    /// Total tokens dispensed across the faucet's lifetime.
    TotalDispensed,
    /// Tokens dispensed so far within the current daily window.
    DailyDispensed,
    /// Index of the daily window `DailyDispensed` is tracked against.
    DayIndex,
    /// Ledger timestamp `recipient` last successfully claimed a drip at.
    LastClaim(Address),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_drip_amount(env: &Env) -> u128 {
    env.storage()
        .instance()
        .get(&DataKey::DripAmount)
        .unwrap_or(0)
}

pub fn set_drip_amount(env: &Env, amount: u128) {
    env.storage().instance().set(&DataKey::DripAmount, &amount);
}

pub fn get_cooldown_sec(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::CooldownSec)
        .unwrap_or(0)
}

pub fn set_cooldown_sec(env: &Env, cooldown: u64) {
    env.storage()
        .instance()
        .set(&DataKey::CooldownSec, &cooldown);
}

pub fn get_daily_cap(env: &Env) -> u128 {
    env.storage()
        .instance()
        .get(&DataKey::DailyCap)
        .unwrap_or(0)
}

pub fn set_daily_cap(env: &Env, cap: u128) {
    env.storage().instance().set(&DataKey::DailyCap, &cap);
}

pub fn get_reserve_balance(env: &Env) -> u128 {
    env.storage()
        .instance()
        .get(&DataKey::ReserveBalance)
        .unwrap_or(0)
}

pub fn set_reserve_balance(env: &Env, balance: u128) {
    env.storage()
        .instance()
        .set(&DataKey::ReserveBalance, &balance);
}

pub fn get_total_dispensed(env: &Env) -> u128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalDispensed)
        .unwrap_or(0)
}

pub fn set_total_dispensed(env: &Env, total: u128) {
    env.storage()
        .instance()
        .set(&DataKey::TotalDispensed, &total);
}

pub fn get_daily_dispensed(env: &Env) -> u128 {
    env.storage()
        .instance()
        .get(&DataKey::DailyDispensed)
        .unwrap_or(0)
}

pub fn set_daily_dispensed(env: &Env, amount: u128) {
    env.storage()
        .instance()
        .set(&DataKey::DailyDispensed, &amount);
}

pub fn get_day_index(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::DayIndex)
        .unwrap_or(0)
}

pub fn set_day_index(env: &Env, day_index: u64) {
    env.storage().instance().set(&DataKey::DayIndex, &day_index);
}

pub fn get_last_claim(env: &Env, recipient: &Address) -> Option<u64> {
    env.storage()
        .persistent()
        .get(&DataKey::LastClaim(recipient.clone()))
}

pub fn set_last_claim(env: &Env, recipient: &Address, timestamp: u64) {
    let key = DataKey::LastClaim(recipient.clone());
    env.storage().persistent().set(&key, &timestamp);
    extend(env, &key);
}
