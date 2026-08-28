#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct SecureVault;

#[contractimpl]
impl SecureVault {
    // Secure: authorizes the caller before mutating their own storage entry.
    pub fn withdraw_all(env: Env, caller: Address) {
        caller.require_auth();
        env.storage().instance().set(&caller, &0i128);
    }

    pub fn get_balance(env: Env, caller: Address) -> i128 {
        env.storage().instance().get(&caller).unwrap_or(0)
    }
}
