//! Stellarcade Map Voting Contract
//!
//! Manages map-voting rounds with ballot participation snapshots and
//! tiebreak-window accessors.
//!
//! ## Read-only accessors
//! - `ballot_participation_snapshot(round_id)` — eligible voters, votes cast,
//!   participation rate in basis points, and active state.
//! - `tiebreak_window(round_id)` — tiebreak window ledger range, required flag,
//!   and live open/closed status.
//!
//! ## Zero-state behaviour
//! Both accessors return `exists = false` with zeroed numeric fields for
//! unknown round ids so callers never need to handle a missing-key error.
//!
//! ## Rounding conventions
//! `participation_bps` = `votes_cast * 10_000 / eligible_voters`, truncated.
//! Returns 0 when `eligible_voters` is zero.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{BallotParticipationSnapshot, TiebreakWindow, VotingRoundRecord};

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Round(u32),
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
pub struct MapVoting;

#[contractimpl]
impl MapVoting {
    /// Initialize the contract. May only be called once.
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Write or update a voting round. Admin only.
    pub fn upsert_round(
        env: Env,
        admin: Address,
        round_id: u32,
        eligible_voters: u32,
        votes_cast: u32,
        round_active: bool,
        tiebreak_required: bool,
        tiebreak_window_start: u32,
        tiebreak_window_end: u32,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_round(
            &env,
            round_id,
            &VotingRoundRecord {
                eligible_voters,
                votes_cast,
                round_active,
                tiebreak_required,
                tiebreak_window_start,
                tiebreak_window_end,
            },
        );
        Ok(())
    }

    /// Return a ballot participation snapshot for `round_id`.
    ///
    /// Unknown round ids return `exists = false` with zeroed fields.
    /// `participation_bps` is 0 when `eligible_voters` is zero.
    pub fn ballot_participation_snapshot(
        env: Env,
        round_id: u32,
    ) -> BallotParticipationSnapshot {
        match storage::get_round(&env, round_id) {
            Some(record) => {
                let participation_bps = if record.eligible_voters == 0 {
                    0
                } else {
                    ((record.votes_cast as u64 * 10_000) / record.eligible_voters as u64) as u32
                };
                BallotParticipationSnapshot {
                    round_id,
                    exists: true,
                    eligible_voters: record.eligible_voters,
                    votes_cast: record.votes_cast,
                    participation_bps,
                    round_active: record.round_active,
                }
            }
            None => BallotParticipationSnapshot {
                round_id,
                exists: false,
                eligible_voters: 0,
                votes_cast: 0,
                participation_bps: 0,
                round_active: false,
            },
        }
    }

    /// Return tiebreak-window details for `round_id`.
    ///
    /// Unknown round ids return `exists = false` with zeroed fields.
    /// `window_open` is computed against the current ledger sequence:
    /// `window_start <= current_ledger < window_end`.
    pub fn tiebreak_window(env: Env, round_id: u32) -> TiebreakWindow {
        match storage::get_round(&env, round_id) {
            Some(record) => {
                let current = env.ledger().sequence();
                let window_open = record.tiebreak_required
                    && current >= record.tiebreak_window_start
                    && current < record.tiebreak_window_end;
                TiebreakWindow {
                    round_id,
                    exists: true,
                    window_start: record.tiebreak_window_start,
                    window_end: record.tiebreak_window_end,
                    tiebreak_required: record.tiebreak_required,
                    window_open,
                }
            }
            None => TiebreakWindow {
                round_id,
                exists: false,
                window_start: 0,
                window_end: 0,
                tiebreak_required: false,
                window_open: false,
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
