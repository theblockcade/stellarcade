#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use crate::storage::{
    get_owners, get_total_locked, get_vault, set_owners, set_total_locked, set_vault,
};
use crate::types::{UnlockReadiness, Vault, VaultLiabilitySummary};

#[contract]
pub struct CreatorVaults;

#[contractimpl]
impl CreatorVaults {
    /// Locks additional funds into the caller's vault. The unlock time only ever
    /// moves later, so an existing lock cannot be shortened by a new deposit.
    pub fn deposit(env: Env, creator: Address, amount: i128, unlock_time: u64) {
        creator.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let existing = get_vault(&env, creator.clone());
        let mut vault = existing.clone().unwrap_or(Vault {
            creator: creator.clone(),
            locked_amount: 0,
            unlock_time: 0,
            is_active: false,
        });

        // Register a brand-new creator in the owners index exactly once.
        if existing.is_none() {
            let mut owners = get_owners(&env);
            owners.push_back(creator.clone());
            set_owners(&env, &owners);
        }

        vault.locked_amount += amount;
        if unlock_time > vault.unlock_time {
            vault.unlock_time = unlock_time;
        }
        vault.is_active = true;
        set_vault(&env, creator.clone(), &vault);

        set_total_locked(&env, get_total_locked(&env) + amount);
    }

    /// Withdraws the full locked balance once the unlock time has passed.
    pub fn withdraw(env: Env, creator: Address) -> i128 {
        creator.require_auth();
        let mut vault = get_vault(&env, creator.clone()).expect("vault not found");
        if !vault.is_active {
            panic!("vault is not active");
        }
        if env.ledger().timestamp() < vault.unlock_time {
            panic!("vault is still locked");
        }

        let amount = vault.locked_amount;
        vault.locked_amount = 0;
        vault.is_active = false;
        set_vault(&env, creator.clone(), &vault);
        set_total_locked(&env, get_total_locked(&env) - amount);
        amount
    }

    /// Aggregate vault liability: total/active vault counts, total locked, and
    /// the portion currently unlockable at the present ledger timestamp.
    pub fn liability_summary(env: Env) -> VaultLiabilitySummary {
        let now = env.ledger().timestamp();
        let owners = get_owners(&env);

        let mut active_vaults: u32 = 0;
        let mut total_unlockable: i128 = 0;

        for owner in owners.iter() {
            if let Some(vault) = get_vault(&env, owner) {
                if vault.is_active {
                    active_vaults += 1;
                    if now >= vault.unlock_time {
                        total_unlockable += vault.locked_amount;
                    }
                }
            }
        }

        VaultLiabilitySummary {
            total_vaults: owners.len(),
            active_vaults,
            total_locked: get_total_locked(&env),
            total_unlockable,
        }
    }

    /// Unlock readiness for a single creator's vault. Returns a predictable
    /// zero-state result when the vault does not exist.
    pub fn unlock_readiness(env: Env, creator: Address) -> UnlockReadiness {
        let now = env.ledger().timestamp();

        match get_vault(&env, creator) {
            Some(vault) => {
                let is_unlockable = vault.is_active && now >= vault.unlock_time;
                let seconds_until_unlock = if now >= vault.unlock_time {
                    0
                } else {
                    vault.unlock_time - now
                };

                UnlockReadiness {
                    vault_exists: true,
                    is_active: vault.is_active,
                    locked_amount: vault.locked_amount,
                    unlock_time: vault.unlock_time,
                    current_time: now,
                    is_unlockable,
                    seconds_until_unlock,
                }
            }
            None => UnlockReadiness {
                vault_exists: false,
                is_active: false,
                locked_amount: 0,
                unlock_time: 0,
                current_time: now,
                is_unlockable: false,
                seconds_until_unlock: 0,
            },
        }
    }

    /// Reads a single vault, returning an empty default when missing.
    pub fn get_vault_state(env: Env, creator: Address) -> Vault {
        get_vault(&env, creator.clone()).unwrap_or(Vault {
            creator,
            locked_amount: 0,
            unlock_time: 0,
            is_active: false,
        })
    }
}
