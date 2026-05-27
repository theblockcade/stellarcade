//! Stellarcade Prize Streamer Contract
//!
//! Tracks prize stream outflow metrics and funding health for a per-stream
//! prize distribution system.
//!
//! ## Read-only accessors
//! - `stream_outflow_summary(stream_id)` — aggregated outflow metrics.
//! - `funding_gap(stream_id)` — remaining balance vs. configured target.
//!
//! ## Zero-state behaviour
//! Both accessors return `exists = false` with zeroed numeric fields when
//! the requested `stream_id` has not been written to storage, so callers
//! never need to handle a missing-key error.

#![no_std]
#![allow(unexpected_cfgs)]
#![allow(clippy::too_many_arguments)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{FundingGap, StreamOutflowSummary, StreamRecord};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Stream(u32),
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
pub struct PrizeStreamer;

#[contractimpl]
impl PrizeStreamer {
    /// Initialize the contract. May only be called once.
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Write or update a stream record. Admin only.
    ///
    /// Existing records are fully replaced. Callers may read, modify, then
    /// re-submit to update individual fields.
    pub fn upsert_stream(
        env: Env,
        admin: Address,
        stream_id: u32,
        total_streamed: i128,
        outflow_rate_per_ledger: i128,
        last_outflow_ledger: u32,
        is_draining: bool,
        total_funding: i128,
        funding_target: i128,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_stream(
            &env,
            stream_id,
            &StreamRecord {
                total_streamed,
                outflow_rate_per_ledger,
                last_outflow_ledger,
                is_draining,
                total_funding,
                funding_target,
            },
        );
        Ok(())
    }

    /// Return aggregated outflow metrics for `stream_id`.
    ///
    /// Unknown stream ids return `exists = false` with zeroed numeric fields.
    /// A paused or exhausted stream is surfaced via `is_draining = false`.
    pub fn stream_outflow_summary(env: Env, stream_id: u32) -> StreamOutflowSummary {
        match storage::get_stream(&env, stream_id) {
            Some(record) => StreamOutflowSummary {
                stream_id,
                exists: true,
                total_streamed: record.total_streamed,
                outflow_rate_per_ledger: record.outflow_rate_per_ledger,
                last_outflow_ledger: record.last_outflow_ledger,
                is_draining: record.is_draining,
            },
            None => StreamOutflowSummary {
                stream_id,
                exists: false,
                total_streamed: 0,
                outflow_rate_per_ledger: 0,
                last_outflow_ledger: 0,
                is_draining: false,
            },
        }
    }

    /// Return the funding gap report for `stream_id`.
    ///
    /// Unknown stream ids return `exists = false` with zeroed numeric fields.
    /// `gap_amount` is floored at zero — a fully-funded stream returns zero.
    /// `is_underfunded` is `true` when `current_balance < funding_target`.
    pub fn funding_gap(env: Env, stream_id: u32) -> FundingGap {
        match storage::get_stream(&env, stream_id) {
            Some(record) => {
                let current_balance = (record.total_funding - record.total_streamed).max(0);
                let gap_amount = (record.funding_target - current_balance).max(0);
                FundingGap {
                    stream_id,
                    exists: true,
                    total_funding: record.total_funding,
                    current_balance,
                    gap_amount,
                    is_underfunded: current_balance < record.funding_target,
                }
            }
            None => FundingGap {
                stream_id,
                exists: false,
                total_funding: 0,
                current_balance: 0,
                gap_amount: 0,
                is_underfunded: false,
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
