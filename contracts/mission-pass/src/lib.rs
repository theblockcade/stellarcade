//! Stellarcade Mission Pass Contract
//!
//! Tracks per-pass mission completion progress and unlock-tier gating.
//!
//! ## Read-only accessors
//! - `pass_progress_snapshot(pass_id)` — completed vs. total missions with pct.
//! - `unlock_gap(pass_id)` — missions remaining until the next unlock tier.
//!
//! ## Zero-state behaviour
//! Both accessors return `exists = false` with zeroed numeric fields when the
//! requested `pass_id` has not been written to storage, so callers never need
//! to handle a missing-key error.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{PassProgressSnapshot, PassRecord, UnlockGap};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Pass(u32),
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct MissionPass;

#[contractimpl]
impl MissionPass {
    /// Initialize the contract. May only be called once.
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Write or update a pass record. Admin only.
    ///
    /// Existing records are fully replaced. Callers may read, modify, then
    /// re-submit to update individual fields.
    pub fn upsert_pass(
        env: Env,
        admin: Address,
        pass_id: u32,
        total_missions: u32,
        completed_missions: u32,
        next_unlock_threshold: u32,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_pass(
            &env,
            pass_id,
            &PassRecord {
                total_missions,
                completed_missions,
                next_unlock_threshold,
            },
        );
        Ok(())
    }

    /// Return a progress snapshot for `pass_id`.
    ///
    /// Unknown pass ids return `exists = false` with zeroed numeric fields.
    /// `completion_pct` is integer division (0–100), rounded down.
    /// `is_complete` is `true` only when `completed_missions == total_missions`
    /// and `total_missions > 0`.
    pub fn pass_progress_snapshot(env: Env, pass_id: u32) -> PassProgressSnapshot {
        match storage::get_pass(&env, pass_id) {
            Some(record) => {
                let completion_pct = (record.completed_missions * 100)
                    .checked_div(record.total_missions)
                    .unwrap_or(0);
                let is_complete = record.total_missions > 0
                    && record.completed_missions >= record.total_missions;
                PassProgressSnapshot {
                    pass_id,
                    exists: true,
                    total_missions: record.total_missions,
                    completed_missions: record.completed_missions,
                    completion_pct,
                    is_complete,
                }
            }
            None => PassProgressSnapshot {
                pass_id,
                exists: false,
                total_missions: 0,
                completed_missions: 0,
                completion_pct: 0,
                is_complete: false,
            },
        }
    }

    /// Return the unlock gap for `pass_id`.
    ///
    /// Unknown pass ids return `exists = false` with zeroed numeric fields.
    /// `missions_to_next_unlock` is floored at zero when the threshold is
    /// already reached.  `locked` is `false` when the threshold is met.
    pub fn unlock_gap(env: Env, pass_id: u32) -> UnlockGap {
        match storage::get_pass(&env, pass_id) {
            Some(record) => {
                let locked = record.completed_missions < record.next_unlock_threshold;
                let missions_to_next_unlock = if locked {
                    record.next_unlock_threshold - record.completed_missions
                } else {
                    0
                };
                UnlockGap {
                    pass_id,
                    exists: true,
                    missions_to_next_unlock,
                    next_unlock_threshold: record.next_unlock_threshold,
                    current_progress: record.completed_missions,
                    locked,
                }
            }
            None => UnlockGap {
                pass_id,
                exists: false,
                missions_to_next_unlock: 0,
                next_unlock_threshold: 0,
                current_progress: 0,
                locked: false,
            },
        }
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod test;
