#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{LiabilitySnapshot, LockRecord, UnlockQueueAccessor};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Lock(u64),
    LockIds,
    ActiveCount,
    ActiveAmount,
    ReleasedCount,
    ReleasedAmount,
    CancelledCount,
    CancelledAmount,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    LockNotFound = 4,
    AlreadyReleased = 5,
    AlreadyCancelled = 6,
    NotUnlockedYet = 7,
}

#[contract]
pub struct SponsorLockbox;

#[contractimpl]
impl SponsorLockbox {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn register_lock(
        env: Env,
        admin: Address,
        lock_id: u64,
        sponsor: Address,
        beneficiary: Address,
        amount: i128,
        unlock_at: u64,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_lock(
            &env,
            &LockRecord {
                lock_id,
                sponsor,
                beneficiary,
                amount,
                unlock_at,
                released: false,
                cancelled: false,
            },
        );
        storage::append_lock_id(&env, lock_id);
        bump_active(&env, 1, amount);
        Ok(())
    }

    pub fn release(env: Env, beneficiary: Address, lock_id: u64) -> Result<i128, Error> {
        beneficiary.require_auth();
        let mut lock = storage::get_lock(&env, lock_id).ok_or(Error::LockNotFound)?;
        if lock.released {
            return Err(Error::AlreadyReleased);
        }
        if lock.cancelled {
            return Err(Error::AlreadyCancelled);
        }
        if lock.beneficiary != beneficiary {
            return Err(Error::NotAuthorized);
        }
        if env.ledger().timestamp() < lock.unlock_at {
            return Err(Error::NotUnlockedYet);
        }
        lock.released = true;
        storage::set_lock(&env, &lock);
        bump_active(&env, -1, -lock.amount);
        bump_released(&env, 1, lock.amount);
        Ok(lock.amount)
    }

    pub fn cancel(env: Env, admin: Address, lock_id: u64) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let mut lock = storage::get_lock(&env, lock_id).ok_or(Error::LockNotFound)?;
        if lock.released {
            return Err(Error::AlreadyReleased);
        }
        if lock.cancelled {
            return Err(Error::AlreadyCancelled);
        }
        lock.cancelled = true;
        storage::set_lock(&env, &lock);
        bump_active(&env, -1, -lock.amount);
        bump_cancelled(&env, 1, lock.amount);
        Ok(())
    }

    pub fn liability_snapshot(env: Env) -> LiabilitySnapshot {
        let queue = Self::unlock_queue_accessor(env.clone());
        LiabilitySnapshot {
            configured: env.storage().instance().has(&DataKey::Admin),
            active_count: storage::read_u32(&env, &DataKey::ActiveCount),
            active_amount: storage::read_i128(&env, &DataKey::ActiveAmount),
            releasable_count: queue.releasable_count,
            releasable_amount: queue.releasable_amount,
            released_count: storage::read_u32(&env, &DataKey::ReleasedCount),
            released_amount: storage::read_i128(&env, &DataKey::ReleasedAmount),
            cancelled_count: storage::read_u32(&env, &DataKey::CancelledCount),
            cancelled_amount: storage::read_i128(&env, &DataKey::CancelledAmount),
            now: env.ledger().timestamp(),
        }
    }

    pub fn unlock_queue_accessor(env: Env) -> UnlockQueueAccessor {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);
        if !configured {
            return UnlockQueueAccessor {
                configured: false,
                indexed_locks: 0,
                pending_count: 0,
                pending_amount: 0,
                releasable_count: 0,
                releasable_amount: 0,
                next_unlock_at: 0,
                now,
            };
        }

        let ids = storage::get_lock_ids(&env);
        let mut pending_count = 0u32;
        let mut pending_amount = 0i128;
        let mut releasable_count = 0u32;
        let mut releasable_amount = 0i128;
        let mut next_unlock_at = 0u64;

        for lock_id in ids.iter() {
            if let Some(lock) = storage::get_lock(&env, lock_id) {
                if lock.released || lock.cancelled {
                    continue;
                }
                if now >= lock.unlock_at {
                    releasable_count = releasable_count.saturating_add(1);
                    releasable_amount = releasable_amount.saturating_add(lock.amount);
                } else {
                    pending_count = pending_count.saturating_add(1);
                    pending_amount = pending_amount.saturating_add(lock.amount);
                    if next_unlock_at == 0 || lock.unlock_at < next_unlock_at {
                        next_unlock_at = lock.unlock_at;
                    }
                }
            }
        }

        UnlockQueueAccessor {
            configured,
            indexed_locks: ids.len(),
            pending_count,
            pending_amount,
            releasable_count,
            releasable_amount,
            next_unlock_at,
            now,
        }
    }
}

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    caller.require_auth();
    if &admin != caller {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

fn bump_active(env: &Env, count_delta: i32, amount_delta: i128) {
    let count = storage::read_u32(env, &DataKey::ActiveCount);
    storage::write_u32(env, &DataKey::ActiveCount, apply_count_delta(count, count_delta));
    let amount = storage::read_i128(env, &DataKey::ActiveAmount);
    storage::write_i128(env, &DataKey::ActiveAmount, amount + amount_delta);
}

fn bump_released(env: &Env, count_delta: i32, amount_delta: i128) {
    let count = storage::read_u32(env, &DataKey::ReleasedCount);
    storage::write_u32(env, &DataKey::ReleasedCount, apply_count_delta(count, count_delta));
    let amount = storage::read_i128(env, &DataKey::ReleasedAmount);
    storage::write_i128(env, &DataKey::ReleasedAmount, amount + amount_delta);
}

fn bump_cancelled(env: &Env, count_delta: i32, amount_delta: i128) {
    let count = storage::read_u32(env, &DataKey::CancelledCount);
    storage::write_u32(env, &DataKey::CancelledCount, apply_count_delta(count, count_delta));
    let amount = storage::read_i128(env, &DataKey::CancelledAmount);
    storage::write_i128(env, &DataKey::CancelledAmount, amount + amount_delta);
}

fn apply_count_delta(count: u32, delta: i32) -> u32 {
    if delta < 0 {
        count.saturating_sub((-delta) as u32)
    } else {
        count.saturating_add(delta as u32)
    }
}

#[cfg(test)]
mod test;
