//! Stellarcade Prize-Router-V2 Contract
//!
//! Routes prize payouts through a delay queue. Exposes a route pressure
//! summary and a per-payout delay accessor for monitoring and frontend use.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

pub use types::*;
use storage::{DataKey, PERSISTENT_BUMP};

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, Vec};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized     = 2,
    NotAuthorized      = 3,
    ContractPaused     = 4,
    InvalidAmount      = 5,
    IndexOutOfRange    = 6,
}

const DEFAULT_DELAY_LEDGERS: u32 = 100;
const DEFAULT_PRESSURE_THRESHOLD: u32 = 50;

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct PrizeRouterV2Contract;

#[contractimpl]
impl PrizeRouterV2Contract {
    // ── Admin ────────────────────────────────────────────────────────────────

    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::DelayLedgers, &DEFAULT_DELAY_LEDGERS);
        env.storage()
            .instance()
            .set(&DataKey::PressureThreshold, &DEFAULT_PRESSURE_THRESHOLD);
        env.storage()
            .instance()
            .set(&DataKey::Queue, &Vec::<PendingPayout>::new(&env));
        Ok(())
    }

    pub fn set_delay(env: Env, admin: Address, delay_ledgers: u32) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage()
            .instance()
            .set(&DataKey::DelayLedgers, &delay_ledgers);
        Ok(())
    }

    pub fn set_pressure_threshold(
        env: Env,
        admin: Address,
        threshold: u32,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage()
            .instance()
            .set(&DataKey::PressureThreshold, &threshold);
        Ok(())
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Paused, &paused);
        Ok(())
    }

    /// Enqueue a payout into the delay queue.
    pub fn enqueue_payout(
        env: Env,
        admin: Address,
        recipient: Address,
        amount: i128,
    ) -> Result<u32, Error> {
        require_admin(&env, &admin)?;
        assert_not_paused(&env)?;

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let delay: u32 = env
            .storage()
            .instance()
            .get(&DataKey::DelayLedgers)
            .unwrap_or(DEFAULT_DELAY_LEDGERS);

        let current_ledger = env.ledger().sequence();
        let entry = PendingPayout {
            recipient,
            amount,
            enqueued_at: current_ledger,
            release_after: current_ledger.saturating_add(delay),
        };

        let mut queue: Vec<PendingPayout> = env
            .storage()
            .instance()
            .get(&DataKey::Queue)
            .unwrap_or(Vec::new(&env));

        let idx = queue.len();
        queue.push_back(entry);
        env.storage().instance().set(&DataKey::Queue, &queue);

        Ok(idx)
    }

    /// Release a releasable payout by index (removes it from the queue).
    pub fn release_payout(env: Env, admin: Address, index: u32) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        assert_not_paused(&env)?;

        let mut queue: Vec<PendingPayout> = env
            .storage()
            .instance()
            .get(&DataKey::Queue)
            .unwrap_or(Vec::new(&env));

        if index >= queue.len() {
            return Err(Error::IndexOutOfRange);
        }

        queue.remove(index);
        env.storage().instance().set(&DataKey::Queue, &queue);
        Ok(())
    }

    // ── Read-only views ──────────────────────────────────────────────────────

    /// Return a route pressure summary for the current queue state.
    ///
    /// Zero-state (empty queue): all counts/amounts 0, `overloaded` false.
    pub fn route_pressure_summary(env: Env) -> RoutePressureSummary {
        let queue: Vec<PendingPayout> = env
            .storage()
            .instance()
            .get(&DataKey::Queue)
            .unwrap_or(Vec::new(&env));

        let threshold: u32 = env
            .storage()
            .instance()
            .get(&DataKey::PressureThreshold)
            .unwrap_or(DEFAULT_PRESSURE_THRESHOLD);

        let current_ledger = env.ledger().sequence();
        let pending_count = queue.len();
        let mut total_pending_amount: i128 = 0;
        let mut releasable_count: u32 = 0;

        for entry in queue.iter() {
            total_pending_amount = total_pending_amount.saturating_add(entry.amount);
            if current_ledger >= entry.release_after {
                releasable_count += 1;
            }
        }

        RoutePressureSummary {
            pending_count,
            total_pending_amount,
            releasable_count,
            overloaded: pending_count > threshold,
        }
    }

    /// Return delay information for a specific payout by queue index.
    ///
    /// Zero-state: `found` false when index is out of range.
    pub fn payout_delay(env: Env, index: u32) -> PayoutDelayInfo {
        let queue: Vec<PendingPayout> = env
            .storage()
            .instance()
            .get(&DataKey::Queue)
            .unwrap_or(Vec::new(&env));

        if index >= queue.len() {
            return PayoutDelayInfo {
                found: false,
                ledgers_remaining: 0,
                releasable: false,
            };
        }

        let entry = queue.get_unchecked(index);
        let current = env.ledger().sequence();
        let releasable = current >= entry.release_after;
        let ledgers_remaining = if releasable {
            0
        } else {
            entry.release_after.saturating_sub(current)
        };

        PayoutDelayInfo {
            found: true,
            ledgers_remaining,
            releasable,
        }
    }

    /// Return the current queue length.
    pub fn queue_length(env: Env) -> u32 {
        let queue: Vec<PendingPayout> = env
            .storage()
            .instance()
            .get(&DataKey::Queue)
            .unwrap_or(Vec::new(&env));
        queue.len()
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    caller.require_auth();
    if caller != &admin {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

fn assert_not_paused(env: &Env) -> Result<(), Error> {
    if env
        .storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
    {
        return Err(Error::ContractPaused);
    }
    Ok(())
}

#[cfg(test)]
mod test;
