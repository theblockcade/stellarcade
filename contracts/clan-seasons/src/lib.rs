//! Stellarcade Clan Seasons Contract
//!
//! Manages per-season clan state including XP/rank carryover snapshots and
//! roster-lock configuration.
//!
//! ## Read-only accessors
//! - `season_carryover_snapshot(season_id)` — carryover XP, rank, and lock flag.
//! - `roster_lock(season_id)` — lock ledger, member count, and reason code.
//!
//! ## Zero-state behaviour
//! Both accessors return `exists = false` with zeroed numeric fields when the
//! requested `season_id` has not been written to storage, so callers never
//! need to handle a missing-key error.

#![no_std]
#![allow(unexpected_cfgs)]
#![allow(clippy::too_many_arguments)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{RosterLock, SeasonCarryoverSnapshot, SeasonRecord};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Season(u32),
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
pub struct ClanSeasons;

#[contractimpl]
impl ClanSeasons {
    /// Initialize the contract. May only be called once.
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Write or update a season record. Admin only.
    ///
    /// Existing records are fully replaced. Callers may read, modify, then
    /// re-submit to update individual fields.
    pub fn upsert_season(
        env: Env,
        admin: Address,
        season_id: u32,
        carryover_xp: u32,
        carryover_rank: u32,
        season_end_ledger: u32,
        was_locked: bool,
        lock_ledger: u32,
        is_locked: bool,
        locked_member_count: u32,
        lock_reason_code: u32,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_season(
            &env,
            season_id,
            &SeasonRecord {
                carryover_xp,
                carryover_rank,
                season_end_ledger,
                was_locked,
                lock_ledger,
                is_locked,
                locked_member_count,
                lock_reason_code,
            },
        );
        Ok(())
    }

    /// Return the carryover snapshot for `season_id`.
    ///
    /// Unknown season ids return `exists = false` with zeroed numeric fields.
    /// `was_locked` surfaces whether the roster was locked when the season ended.
    pub fn season_carryover_snapshot(env: Env, season_id: u32) -> SeasonCarryoverSnapshot {
        match storage::get_season(&env, season_id) {
            Some(record) => SeasonCarryoverSnapshot {
                season_id,
                exists: true,
                carryover_xp: record.carryover_xp,
                carryover_rank: record.carryover_rank,
                season_end_ledger: record.season_end_ledger,
                was_locked: record.was_locked,
            },
            None => SeasonCarryoverSnapshot {
                season_id,
                exists: false,
                carryover_xp: 0,
                carryover_rank: 0,
                season_end_ledger: 0,
                was_locked: false,
            },
        }
    }

    /// Return the roster-lock state for `season_id`.
    ///
    /// Unknown season ids return `exists = false` with zeroed numeric fields.
    /// `lock_reason_code`: 0 = not locked, 1 = season-end lock, 2 = admin lock.
    pub fn roster_lock(env: Env, season_id: u32) -> RosterLock {
        match storage::get_season(&env, season_id) {
            Some(record) => RosterLock {
                season_id,
                exists: true,
                lock_ledger: record.lock_ledger,
                is_locked: record.is_locked,
                locked_member_count: record.locked_member_count,
                lock_reason_code: record.lock_reason_code,
            },
            None => RosterLock {
                season_id,
                exists: false,
                lock_ledger: 0,
                is_locked: false,
                locked_member_count: 0,
                lock_reason_code: 0,
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
