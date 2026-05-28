#![no_std]

use soroban_sdk::{Address, Env, Map, Vec};
use crate::{DataKey, ReserveAllocation};

/// Storage utilities for wallet reserves
pub struct Storage;

impl Storage {
    /// Get all wallet addresses with reserves
    pub fn get_all_wallet_addresses(env: &Env) -> Vec<Address> {
        // In a real implementation, we would maintain a separate index
        // For now, return empty vector as we don't have iteration capabilities
        Vec::new(env)
    }

    /// Get reserve allocation for a wallet
    pub fn get_wallet_reserve(env: &Env, wallet: &Address) -> Option<ReserveAllocation> {
        env.storage()
            .persistent()
            .get(&DataKey::WalletReserve(wallet.clone()))
    }

    /// Set reserve allocation for a wallet
    pub fn set_wallet_reserve(env: &Env, wallet: &Address, allocation: &ReserveAllocation) {
        env.storage()
            .persistent()
            .set(&DataKey::WalletReserve(wallet.clone()), allocation);
    }

    /// Remove wallet reserve allocation
    pub fn remove_wallet_reserve(env: &Env, wallet: &Address) {
        env.storage()
            .persistent()
            .remove(&DataKey::WalletReserve(wallet.clone()));
    }

    /// Check if wallet has reserves
    pub fn has_wallet_reserve(env: &Env, wallet: &Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::WalletReserve(wallet.clone()))
    }

    /// Get total reserves across all wallets
    pub fn get_total_reserves(env: &Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalReserves)
            .unwrap_or(0)
    }

    /// Set total reserves
    pub fn set_total_reserves(env: &Env, total: i128) {
        env.storage()
            .persistent()
            .set(&DataKey::TotalReserves, &total);
    }

    /// Extend TTL for wallet reserve data
    pub fn extend_wallet_reserve_ttl(env: &Env, wallet: &Address) {
        let key = DataKey::WalletReserve(wallet.clone());
        env.storage().persistent().extend_ttl(&key, 100, 100);
    }

    /// Extend TTL for global data
    pub fn extend_global_ttl(env: &Env) {
        env.storage().persistent().extend_ttl(&DataKey::Admin, 100, 100);
        env.storage().persistent().extend_ttl(&DataKey::Initialized, 100, 100);
        env.storage().persistent().extend_ttl(&DataKey::Paused, 100, 100);
        env.storage().persistent().extend_ttl(&DataKey::TotalReserves, 100, 100);
    }
}