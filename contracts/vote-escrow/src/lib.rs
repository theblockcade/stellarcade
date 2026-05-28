#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{LockDurationBreakdown, LockRecord, LockStatus, UnlockPressure};

const LONG_LOCK_THRESHOLD: u64 = 52_560_000;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Lock(u64),
    TotalLockedAmount,
    TotalLocks,
    ShortLocks,
    LongLocks,
    UnlockedAmount,
}

#[contract]
pub struct VoteEscrow;

#[contractimpl]
impl VoteEscrow {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn lock(
        env: Env,
        locker: Address,
        lock_id: u64,
        amount: i128,
        unlock_time: u64,
    ) {
        locker.require_auth();
        assert!(amount > 0, "Amount must be positive");
        assert!(unlock_time > env.ledger().timestamp(), "Unlock time must be in future");

        let locked_at = env.ledger().timestamp();
        let duration = unlock_time - locked_at;

        let is_long = duration > LONG_LOCK_THRESHOLD;

        let record = LockRecord {
            lock_id,
            locker: locker.clone(),
            amount,
            locked_at,
            unlock_time,
            unlocked: false,
        };

        storage::set_lock(&env, &record);
        storage::add_total_locked_amount(&env, amount);
        storage::increment_total_locks(&env);

        if is_long {
            storage::increment_long_locks(&env);
        } else {
            storage::increment_short_locks(&env);
        }
    }

    pub fn unlock(env: Env, admin: Address, lock_id: u64) -> i128 {
        admin.require_auth();

        let mut record = storage::get_lock(&env, lock_id).expect("Lock not found");
        assert!(!record.unlocked, "Already unlocked");
        assert!(env.ledger().timestamp() >= record.unlock_time, "Lock period not expired");

        record.unlocked = true;
        storage::set_lock(&env, &record);
        storage::add_unlocked_amount(&env, record.amount);

        record.amount
    }

    pub fn lock_duration_breakdown(env: Env) -> LockDurationBreakdown {
        let configured = env.storage().instance().has(&DataKey::Admin);

        LockDurationBreakdown {
            configured,
            total_locked_amount: storage::get_total_locked_amount(&env),
            total_locks: storage::get_total_locks(&env),
            short_locks: storage::get_short_locks(&env),
            long_locks: storage::get_long_locks(&env),
            unlocked_amount: storage::get_unlocked_amount(&env),
        }
    }

    pub fn unlock_pressure(env: Env, lock_id: u64) -> UnlockPressure {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(record) = storage::get_lock(&env, lock_id) else {
            return UnlockPressure {
                lock_id,
                configured,
                exists: false,
                status: if configured {
                    LockStatus::Locked
                } else {
                    LockStatus::NotConfigured
                },
                amount: 0,
                locked_at: 0,
                unlock_time: 0,
                now,
                time_remaining: 0,
            };
        };

        let status = if record.unlocked {
            LockStatus::Unlocked
        } else if now >= record.unlock_time {
            LockStatus::Unlockable
        } else {
            LockStatus::Locked
        };

        let time_remaining = if now >= record.unlock_time {
            0
        } else {
            (record.unlock_time - now) as i64
        };

        UnlockPressure {
            lock_id,
            configured,
            exists: true,
            status,
            amount: record.amount,
            locked_at: record.locked_at,
            unlock_time: record.unlock_time,
            now,
            time_remaining,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_init() {
        let env = Env::default();
        let admin = Address::random(&env);
        VoteEscrow::init(env.clone(), admin);
    }

    #[test]
    fn test_lock_and_unlock() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);

        let admin = Address::random(&env);
        let locker = Address::random(&env);

        VoteEscrow::init(env.clone(), admin.clone());
        VoteEscrow::lock(env.clone(), locker.clone(), 1, 1000, 3000);

        let breakdown = VoteEscrow::lock_duration_breakdown(env.clone());
        assert_eq!(breakdown.total_locked_amount, 1000);
        assert_eq!(breakdown.total_locks, 1);

        env.ledger().set_timestamp(3100);
        let unlocked_amount = VoteEscrow::unlock(env.clone(), admin, 1);
        assert_eq!(unlocked_amount, 1000);

        let breakdown = VoteEscrow::lock_duration_breakdown(env);
        assert_eq!(breakdown.unlocked_amount, 1000);
    }

    #[test]
    fn test_unlock_pressure_missing() {
        let env = Env::default();
        let admin = Address::random(&env);
        VoteEscrow::init(env.clone(), admin);

        let pressure = VoteEscrow::unlock_pressure(env, 999);
        assert_eq!(pressure.exists, false);
        assert_eq!(pressure.configured, true);
    }
}
