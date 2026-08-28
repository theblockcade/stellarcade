#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct VulnerableVault;

#[contractimpl]
impl VulnerableVault {
    // Vulnerable: mutates storage keyed by `caller` but never calls
    // `caller.require_auth()` — anyone can drain any account's balance to
    // zero on behalf of any other caller.
    pub fn withdraw_all(env: Env, caller: Address) {
        env.storage().instance().set(&caller, &0i128);
    }

    // Not vulnerable: read-only, no mutation.
    pub fn get_balance(env: Env, caller: Address) -> i128 {
        env.storage().instance().get(&caller).unwrap_or(0)
    }
}
