use soroban_sdk::{Address, Env, Vec};
use crate::types::{BalanceLockSummary, DataKey, LockStatus, LockedAsset, UnlockReadinessInfo};

/// Retrieve a locked asset by beneficiary and lock_id.
/// Returns None if not found.
pub fn get_lock(env: &Env, beneficiary: &Address, lock_id: u32) -> Option<LockedAsset> {
    env.storage()
        .persistent()
        .get(&DataKey::Lock(beneficiary.clone(), lock_id))
}

/// Store a locked asset.
pub fn set_lock(env: &Env, beneficiary: &Address, lock_id: u32, locked_asset: &LockedAsset) {
    env.storage()
        .persistent()
        .set(&DataKey::Lock(beneficiary.clone(), lock_id), locked_asset);
}

/// Get all lock IDs for a beneficiary.
/// Returns empty vec if beneficiary has no locks.
pub fn get_beneficiary_lock_ids(env: &Env, beneficiary: &Address) -> Vec<u32> {
    env.storage()
        .persistent()
        .get(&DataKey::BeneficiaryLocks(beneficiary.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

/// Store the lock ID list for a beneficiary.
pub fn set_beneficiary_lock_ids(env: &Env, beneficiary: &Address, lock_ids: &Vec<u32>) {
    env.storage()
        .persistent()
        .set(&DataKey::BeneficiaryLocks(beneficiary.clone()), lock_ids);
}

/// Get cached total locked amount for a beneficiary.
pub fn get_beneficiary_total_locked(env: &Env, beneficiary: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::BeneficiaryTotalLocked(beneficiary.clone()))
        .unwrap_or(0)
}

/// Update cached total locked amount.
pub fn set_beneficiary_total_locked(env: &Env, beneficiary: &Address, total: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::BeneficiaryTotalLocked(beneficiary.clone()), &total);
}

/// Compute balance lock summary for a beneficiary.
/// Handles empty state and missing locks gracefully.
pub fn compute_balance_lock_summary(
    env: &Env,
    beneficiary: &Address,
) -> BalanceLockSummary {
    let lock_ids = get_beneficiary_lock_ids(env, beneficiary);

    if lock_ids.is_empty() {
        // Empty lock state
        return BalanceLockSummary {
            total_locked: 0,
            lock_count: 0,
            ready_to_unlock_count: 0,
            ready_to_unlock_amount: 0,
            earliest_unlock_ledger: 0,
        };
    }

    let current_ledger = env.ledger().sequence() as u32;
    let mut total_locked: i128 = 0;
    let mut ready_to_unlock_count: u32 = 0;
    let mut ready_to_unlock_amount: i128 = 0;
    let mut earliest_unlock_ledger: u32 = u32::MAX;

    for lock_id in lock_ids.iter() {
        if let Some(locked_asset) = get_lock(env, beneficiary, lock_id) {
            total_locked = total_locked.checked_add(locked_asset.amount)
                .unwrap_or(total_locked);

            if locked_asset.unlock_ledger <= current_ledger {
                ready_to_unlock_count += 1;
                ready_to_unlock_amount = ready_to_unlock_amount.checked_add(locked_asset.amount)
                    .unwrap_or(ready_to_unlock_amount);
            }

            if locked_asset.unlock_ledger < earliest_unlock_ledger {
                earliest_unlock_ledger = locked_asset.unlock_ledger;
            }
        }
    }

    if earliest_unlock_ledger == u32::MAX {
        earliest_unlock_ledger = 0;
    }

    BalanceLockSummary {
        total_locked,
        lock_count: lock_ids.len(),
        ready_to_unlock_count,
        ready_to_unlock_amount,
        earliest_unlock_ledger,
    }
}

/// Check unlock readiness for a specific lock.
/// Handles missing lock gracefully.
pub fn get_unlock_readiness(
    env: &Env,
    beneficiary: &Address,
    lock_id: u32,
) -> UnlockReadinessInfo {
    let current_ledger = env.ledger().sequence() as u32;

    if let Some(locked_asset) = get_lock(env, beneficiary, lock_id) {
        let status = if locked_asset.unlock_ledger <= current_ledger {
            LockStatus::ReadyToUnlock
        } else {
            LockStatus::Locked
        };

        let ledgers_remaining = if locked_asset.unlock_ledger > current_ledger {
            locked_asset.unlock_ledger - current_ledger
        } else {
            0
        };

        UnlockReadinessInfo {
            status,
            lock_id,
            amount: locked_asset.amount,
            unlock_ledger: locked_asset.unlock_ledger,
            current_ledger,
            ledgers_remaining,
        }
    } else {
        // Missing lock state
        UnlockReadinessInfo {
            status: LockStatus::Unlocked, // Treat missing as unlocked/claimed
            lock_id,
            amount: 0,
            unlock_ledger: 0,
            current_ledger,
            ledgers_remaining: 0,
        }
    }
}
