//! Stellarcade Arena Ladder Contract
//!
//! Manages per-bracket competitive pressure and promotion-window state for
//! the arena ladder system.
//!
//! ## Read-only accessors
//! - `bracket_pressure_snapshot(bracket_id)` — player count, pressure score,
//!   and elimination-critical flag.
//! - `promotion_window(bracket_id)` — window ledger range and eligibility rank.
//!
//! ## Zero-state behaviour
//! Both accessors return `exists = false` with zeroed numeric fields when the
//! requested `bracket_id` has not been written to storage, so callers never
//! need to handle a missing-key error.

#![no_std]
#![allow(unexpected_cfgs)]
#![allow(clippy::too_many_arguments)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{BracketPressureSnapshot, BracketRecord, PromotionWindow};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Bracket(u32),
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
pub struct ArenaLadder;

#[contractimpl]
impl ArenaLadder {
    /// Initialize the contract. May only be called once.
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Write or update a bracket record. Admin only.
    ///
    /// Existing records are fully replaced. Callers may read, modify, then
    /// re-submit to update individual fields.
    pub fn upsert_bracket(
        env: Env,
        admin: Address,
        bracket_id: u32,
        players_in_bracket: u32,
        elimination_threshold: u32,
        pressure_score: u32,
        window_open_ledger: u32,
        window_close_ledger: u32,
        min_rank_for_promotion: u32,
        window_active: bool,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_bracket(
            &env,
            bracket_id,
            &BracketRecord {
                players_in_bracket,
                elimination_threshold,
                pressure_score,
                window_open_ledger,
                window_close_ledger,
                min_rank_for_promotion,
                window_active,
            },
        );
        Ok(())
    }

    /// Return the bracket pressure snapshot for `bracket_id`.
    ///
    /// Unknown bracket ids return `exists = false` with zeroed numeric fields.
    /// `is_critical` is `true` when `players_in_bracket <= elimination_threshold`.
    pub fn bracket_pressure_snapshot(env: Env, bracket_id: u32) -> BracketPressureSnapshot {
        match storage::get_bracket(&env, bracket_id) {
            Some(record) => BracketPressureSnapshot {
                bracket_id,
                exists: true,
                players_in_bracket: record.players_in_bracket,
                elimination_threshold: record.elimination_threshold,
                pressure_score: record.pressure_score,
                is_critical: record.players_in_bracket <= record.elimination_threshold,
            },
            None => BracketPressureSnapshot {
                bracket_id,
                exists: false,
                players_in_bracket: 0,
                elimination_threshold: 0,
                pressure_score: 0,
                is_critical: false,
            },
        }
    }

    /// Return the promotion window for `bracket_id`.
    ///
    /// Unknown bracket ids return `exists = false` with zeroed numeric fields.
    /// `window_active` is `false` when the window has been administratively
    /// closed, regardless of ledger range.
    pub fn promotion_window(env: Env, bracket_id: u32) -> PromotionWindow {
        match storage::get_bracket(&env, bracket_id) {
            Some(record) => PromotionWindow {
                bracket_id,
                exists: true,
                window_open_ledger: record.window_open_ledger,
                window_close_ledger: record.window_close_ledger,
                min_rank_for_promotion: record.min_rank_for_promotion,
                window_active: record.window_active,
            },
            None => PromotionWindow {
                bracket_id,
                exists: false,
                window_open_ledger: 0,
                window_close_ledger: 0,
                min_rank_for_promotion: 0,
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
