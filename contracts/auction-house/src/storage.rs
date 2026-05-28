#![no_std]

use soroban_sdk::{contracttype, Address, Env};

use crate::types::*;

// Storage keys

#[contracttype]
pub enum DataKey {
    Admin,
    ActiveLots,
    BidWindow,
}

// Storage functions

pub fn get_admin(env: &Env) -> Address {
    // Placeholder - would return actual admin
    Address::generate(env)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_active_lots(env: &Env) -> u32 {
    // Placeholder - would return actual count
    0
}

pub fn get_bid_window_start(env: &Env) -> u64 {
    // Placeholder - would return actual start time
    0
}

pub fn get_bid_window_end(env: &Env) -> u64 {
    // Placeholder - would return actual end time
    0
}