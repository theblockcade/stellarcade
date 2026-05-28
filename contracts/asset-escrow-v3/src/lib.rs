//! Stellarcade Asset Escrow V3 Contract
//!
//! Manages locked assets with balance summaries and unlock-readiness accessors.
//! Provides structured reads for frontend/backend consumers with explicit fallback
//! behavior and backward-compatible storage patterns.
//!
//! ## Features
//! - **Balance Lock Summary**: Aggregated snapshot of all locks for a beneficiary
//! - **Unlock Readiness Accessor**: Per-lock unlock status and countdown
//! - **Graceful Degradation**: Explicit handling of empty/paused/missing-state scenarios
//! - **Storage Invariants**: Persistent locks with instance metadata

#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, Address, Env, Vec};

mod types;
mod storage;

use types::{BalanceLockSummary, DataKey, LockStatus, LockedAsset, UnlockReadinessInfo};
use storage::{
    compute_balance_lock_summary, get_beneficiary_lock_ids, get_beneficiary_total_locked,
    get_lock, get_unlock_readiness, set_beneficiary_lock_ids, set_beneficiary_total_locked,
    set_lock,
};

// ──────────────────────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────────────────────

#[contractevent]
pub struct LockCreated {
    #[topic]
    pub beneficiary: Address,
    pub lock_id: u32,
    pub amount: i128,
    pub unlock_ledger: u32,
}

#[contractevent]
pub struct LockUnlocked {
    #[topic]
    pub beneficiary: Address,
    pub lock_id: u32,
    pub amount: i128,
}

#[contractevent]
pub struct AdminSet {
    pub admin: Address,
}

// ──────────────────────────────────────────────────────────────
// Contract
// ──────────────────────────────────────────────────────────────

#[contract]
pub struct AssetEscrowV3;

#[contractimpl]
impl AssetEscrowV3 {
    /// Initialize the contract with a super admin.
    /// Can only be called once.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::NextLockId, &1u32);

        AdminSet { admin }.publish(&env);
    }

    /// Get the current admin.
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized")
    }

    /// Create a new lock entry for a beneficiary.
    pub fn create_lock(
        env: Env,
        beneficiary: Address,
        amount: i128,
        unlock_ledger: u32,
    ) -> u32 {
        require_admin(&env);

        if amount <= 0 {
            panic!("Invalid amount");
        }

        let current_ledger = env.ledger().sequence() as u32;
        if unlock_ledger < current_ledger {
            panic!("Invalid unlock ledger");
        }

        // Get next lock ID
        let lock_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::NextLockId)
            .unwrap_or(1);

        // Create lock entry
        let locked_asset = LockedAsset {
            beneficiary: beneficiary.clone(),
            amount,
            unlock_ledger,
            lock_id,
        };

        // Store lock
        set_lock(&env, &beneficiary, lock_id, &locked_asset);

        // Add to beneficiary's lock list
        let mut lock_ids = get_beneficiary_lock_ids(&env, &beneficiary);
        lock_ids.push_back(lock_id);
        set_beneficiary_lock_ids(&env, &beneficiary, &lock_ids);

        // Update cache
        let current_total = get_beneficiary_total_locked(&env, &beneficiary);
        let new_total = current_total.checked_add(amount).unwrap_or(current_total);
        set_beneficiary_total_locked(&env, &beneficiary, new_total);

        // Increment next lock ID
        let next_id = lock_id.checked_add(1).unwrap_or(lock_id);
        env.storage().instance().set(&DataKey::NextLockId, &next_id);

        LockCreated {
            beneficiary,
            lock_id,
            amount,
            unlock_ledger,
        }
        .publish(&env);

        lock_id
    }

    /// Mark a lock as claimed/unlocked.
    pub fn claim_lock(env: Env, beneficiary: Address, lock_id: u32) -> i128 {
        beneficiary.require_auth();

        if let Some(locked_asset) = get_lock(&env, &beneficiary, lock_id) {
            let current_ledger = env.ledger().sequence() as u32;

            if current_ledger < locked_asset.unlock_ledger {
                panic!("Lock not yet ready to unlock");
            }

            let amount = locked_asset.amount;

            // Remove from storage
            env.storage()
                .persistent()
                .remove(&DataKey::Lock(beneficiary.clone(), lock_id));

            // Remove from lock list
            let mut lock_ids = get_beneficiary_lock_ids(&env, &beneficiary);
            let mut new_ids = Vec::new(&env);
            for id in lock_ids.iter() {
                if id != lock_id {
                    new_ids.push_back(id);
                }
            }
            set_beneficiary_lock_ids(&env, &beneficiary, &new_ids);

            // Update cache
            let current_total = get_beneficiary_total_locked(&env, &beneficiary);
            let new_total = current_total.checked_sub(amount).unwrap_or(0);
            set_beneficiary_total_locked(&env, &beneficiary, new_total);

            LockUnlocked {
                beneficiary,
                lock_id,
                amount,
            }
            .publish(&env);

            amount
        } else {
            panic!("Lock not found");
        }
    }

    /// Get a summary of all locks for a beneficiary.
    /// Returns graceful empty state if no locks exist.
    pub fn get_balance_lock_summary(env: Env, beneficiary: Address) -> BalanceLockSummary {
        compute_balance_lock_summary(&env, &beneficiary)
    }

    /// Get unlock readiness for a specific lock.
    /// Handles missing lock by treating as unlocked/claimed.
    pub fn get_unlock_readiness(
        env: Env,
        beneficiary: Address,
        lock_id: u32,
    ) -> UnlockReadinessInfo {
        get_unlock_readiness(&env, &beneficiary, lock_id)
    }

    /// List all lock IDs for a beneficiary (paginated).
    pub fn list_locks(env: Env, beneficiary: Address, start: u32, limit: u32) -> Vec<u32> {
        let all_locks = get_beneficiary_lock_ids(&env, &beneficiary);
        let total = all_locks.len();

        let mut result = Vec::new(&env);
        let end = start.saturating_add(limit).min(total);

        for i in start..end {
            if let Some(lock_id) = all_locks.get(i) {
                result.push_back(lock_id);
            }
        }

        result
    }
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

fn require_admin(env: &Env) {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    admin.require_auth();
}

#[cfg(test)]
mod test;
