//! Stellarcade Jackpot Pool Contract
//!
//! A shared prize pool that tracks contributor shares and exposes read-only
//! snapshots of contributor health and next-draw funding status.
//!
//! ## Round lifecycle
//! 1. Admin initialises the contract with a token and minimum draw target.
//! 2. Contributors call `contribute` to add tokens to the pool.
//! 3. Frontend polls `contributor_breakdown` and `funding_snapshot` to show
//!    live pool health without any off-chain aggregation.
//! 4. Admin calls `reset_round` after a payout to start a fresh round.
//!    Historical snapshot data is cleared; new contributions are accepted.
//!
//! ## Read-only accessors
//! - `contributor_breakdown` — aggregated contributor count, total, and top
//!   contributor share in basis points.
//! - `funding_snapshot` — current funded amount, minimum target, and
//!   shortfall for the next draw.
#![no_std]

mod storage;
mod types;

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
};

pub use types::{ContributorSummary, FundingSnapshot};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASIS_POINTS: u32 = 10_000;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    InvalidAmount = 4,
    Overflow = 5,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    /// Minimum token amount needed to trigger a draw.
    MinDrawTarget,
    /// Running total of all contributions this round.
    TotalContributed,
    /// Number of unique contributor addresses this round.
    ContributorCount,
    /// Largest single contribution amount this round.
    TopContribution,
    /// Per-address contribution amount this round.
    ContributorAmount(Address),
    /// Current round number (incremented on reset).
    RoundNumber,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[contractevent]
pub struct Contributed {
    #[topic]
    pub contributor: Address,
    pub amount: i128,
    pub new_total: i128,
}

#[contractevent]
pub struct RoundReset {
    #[topic]
    pub round_number: u32,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct JackpotPool;

#[contractimpl]
impl JackpotPool {
    /// Initialise the jackpot pool.
    ///
    /// `min_draw_target` is the minimum token balance required before a draw
    /// can be triggered.
    pub fn init(
        env: Env,
        admin: Address,
        token: Address,
        min_draw_target: i128,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();

        if min_draw_target <= 0 {
            return Err(Error::InvalidAmount);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage()
            .instance()
            .set(&DataKey::MinDrawTarget, &min_draw_target);
        env.storage().instance().set(&DataKey::RoundNumber, &0u32);

        // Initialise aggregate counters
        storage::set_total_contributed(&env, 0);
        storage::set_contributor_count(&env, 0);
        storage::set_top_contribution(&env, 0);

        Ok(())
    }

    /// Contribute tokens to the jackpot pool.
    ///
    /// Tracks per-address totals, global totals, and updates the top
    /// contributor record if this contribution exceeds the current maximum.
    pub fn contribute(env: Env, contributor: Address, amount: i128) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        contributor.require_auth();

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token).transfer(
            &contributor,
            env.current_contract_address(),
            &amount,
        );

        // Update per-address contribution
        let prev = storage::get_contributor_amount(&env, &contributor);
        let new_contrib_total = prev.checked_add(amount).ok_or(Error::Overflow)?;
        storage::set_contributor_amount(&env, &contributor, new_contrib_total);

        // Increment global count only for first-time contributors this round
        if prev == 0 {
            let count = storage::get_contributor_count(&env)
                .checked_add(1)
                .ok_or(Error::Overflow)?;
            storage::set_contributor_count(&env, count);
        }

        // Update running total
        let new_total = storage::get_total_contributed(&env)
            .checked_add(amount)
            .ok_or(Error::Overflow)?;
        storage::set_total_contributed(&env, new_total);

        // Update top contribution record if applicable
        if new_contrib_total > storage::get_top_contribution(&env) {
            storage::set_top_contribution(&env, new_contrib_total);
        }

        Contributed {
            contributor,
            amount,
            new_total,
        }
        .publish(&env);

        Ok(())
    }

    /// Admin resets the pool after a payout. Clears all contribution
    /// accounting for the round; per-address entries remain readable but the
    /// aggregate counters reset to zero.
    pub fn reset_round(env: Env, admin: Address) -> Result<u32, Error> {
        Self::require_admin(&env, &admin)?;
        admin.require_auth();

        storage::set_total_contributed(&env, 0);
        storage::set_contributor_count(&env, 0);
        storage::set_top_contribution(&env, 0);

        let round: u32 = env
            .storage()
            .instance()
            .get(&DataKey::RoundNumber)
            .unwrap_or(0u32);
        let next_round = round.checked_add(1).ok_or(Error::Overflow)?;
        env.storage()
            .instance()
            .set(&DataKey::RoundNumber, &next_round);

        RoundReset {
            round_number: next_round,
        }
        .publish(&env);

        Ok(next_round)
    }

    // -----------------------------------------------------------------------
    // Read-only accessors
    // -----------------------------------------------------------------------

    /// Return a breakdown of contributor metrics for the current round.
    ///
    /// `top_contributor_share_bps` is computed as
    /// `(top_contribution * 10_000) / total_contributed` (integer division).
    /// Returns zeroed fields when the pool has not been seeded.
    pub fn contributor_breakdown(env: Env) -> ContributorSummary {
        let total_contributed = storage::get_total_contributed(&env);
        let contributor_count = storage::get_contributor_count(&env);
        let top_contribution = storage::get_top_contribution(&env);

        let top_contributor_share_bps = if total_contributed > 0 {
            // Cast to i128 for multiplication, then back to u32 — safe because
            // result is at most 10_000.
            let share = (top_contribution * BASIS_POINTS as i128) / total_contributed;
            share as u32
        } else {
            0u32
        };

        ContributorSummary {
            total_contributed,
            contributor_count,
            top_contributor_share_bps,
        }
    }

    /// Return a funding snapshot for the next draw.
    ///
    /// Returns zeroed fields when the contract has not been initialised.
    /// `shortfall` is `max(0, minimum_target − current_funded)`.
    pub fn funding_snapshot(env: Env) -> FundingSnapshot {
        let minimum_target: i128 = env
            .storage()
            .instance()
            .get(&DataKey::MinDrawTarget)
            .unwrap_or(0i128);
        let current_funded = storage::get_total_contributed(&env);

        let shortfall = if current_funded >= minimum_target {
            0i128
        } else {
            minimum_target.saturating_sub(current_funded)
        };
        let is_funded = current_funded >= minimum_target && minimum_target > 0;

        FundingSnapshot {
            minimum_target,
            current_funded,
            shortfall,
            is_funded,
        }
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    fn require_initialized(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        Ok(())
    }

    fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        if *caller != admin {
            return Err(Error::NotAuthorized);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test;
