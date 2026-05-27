//! Stellarcade Ladder Seasons Contract
//!
//! Manages per-season ladder state including transition snapshots and
//! demotion-cutoff configuration.
//!
//! ## Read-only accessors
//! - `season_transition_snapshot(season_id)` — returns end-of-season metrics.
//! - `demotion_cutoff(season_id)` — returns the demotion boundary for a season.
//!
//! ## Zero-state behaviour
//! Both accessors return `exists = false` with zeroed numeric fields when the
//! requested `season_id` has not been written to storage, so callers never
//! need to handle a missing-key error.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{DemotionCutoff, SeasonRecord, SeasonTransitionSnapshot};

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
pub struct LadderSeasons;

#[contractimpl]
impl LadderSeasons {
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
    /// Existing records are fully replaced so callers can update individual
    /// fields by reading first and re-submitting the modified struct.
    pub fn upsert_season(
        env: Env,
        admin: Address,
        season_id: u32,
        total_participants: u32,
        top_score: u32,
        ended_at_ledger: u32,
        was_paused: bool,
        cutoff_score: u32,
        cutoff_rank: u32,
        demotion_window_end: u32,
        demotion_window_active: bool,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_season(
            &env,
            season_id,
            &SeasonRecord {
                total_participants,
                top_score,
                ended_at_ledger,
                was_paused,
                cutoff_score,
                cutoff_rank,
                demotion_window_end,
                demotion_window_active,
            },
        );
        Ok(())
    }

    /// Return a transition snapshot for `season_id`.
    ///
    /// Unknown season ids return `exists = false` with zeroed numeric fields.
    /// Paused seasons are surfaced via `was_paused = true`.
    pub fn season_transition_snapshot(env: Env, season_id: u32) -> SeasonTransitionSnapshot {
        match storage::get_season(&env, season_id) {
            Some(record) => SeasonTransitionSnapshot {
                season_id,
                exists: true,
                ended_at_ledger: record.ended_at_ledger,
                total_participants: record.total_participants,
                top_score: record.top_score,
                was_paused: record.was_paused,
            },
            None => SeasonTransitionSnapshot {
                season_id,
                exists: false,
                ended_at_ledger: 0,
                total_participants: 0,
                top_score: 0,
                was_paused: false,
            },
        }
    }

    /// Return the demotion cutoff for `season_id`.
    ///
    /// Unknown season ids return `exists = false` with zeroed numeric fields.
    /// When `demotion_window_active` is `false` the window has closed and no
    /// demotions will be processed.
    pub fn demotion_cutoff(env: Env, season_id: u32) -> DemotionCutoff {
        match storage::get_season(&env, season_id) {
            Some(record) => DemotionCutoff {
                season_id,
                exists: true,
                cutoff_score: record.cutoff_score,
                cutoff_rank: record.cutoff_rank,
                demotion_window_end: record.demotion_window_end,
                window_active: record.demotion_window_active,
            },
            None => DemotionCutoff {
                season_id,
                exists: false,
                cutoff_score: 0,
                cutoff_rank: 0,
                demotion_window_end: 0,
                window_active: false,
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
