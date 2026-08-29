//! Stellarcade Prize Escrow Timelock Contract (experimental)
//!
//! Holds tournament jackpot payouts behind a challenge-window timelock
//! (e.g. 1 hour) before the winner may claim them, giving a designated
//! arbiter time to freeze a payout if an anti-cheat violation is
//! reported. A clean payout (no dispute raised before the timelock
//! expires) releases 100% of the escrowed amount to the winner; a
//! confirmed-fraud payout is redirected back to the tournament pool by
//! the arbiter instead.
//!
//! Following the `escrow-milestone` sibling contract's convention, the
//! arbiter empowered to freeze/resolve a given payout is designated at
//! `queue_payout` time (by whoever queues it, typically the tournament
//! contract/host) and stored per-payout, rather than via a separate
//! global registry call. Like other contracts in this experimental
//! workspace, this contract is bookkeeping-only: it tracks who is owed
//! what but does not itself move tokens.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, Symbol};

pub use types::{PayoutStatus, PayoutSummary};
use types::QueuedPayout;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    PayoutNotFound = 1,
    InvalidDelay = 2,
    InvalidAmount = 3,
    UnauthorizedArbiter = 4,
    UnauthorizedWinner = 5,
    TimelockNotExpired = 6,
    PayoutFrozen = 7,
    PayoutNotPending = 8,
    PayoutNotFrozen = 9,
    PayoutAlreadySettled = 10,
}

#[contract]
pub struct PrizeEscrowTimelock;

#[contractimpl]
impl PrizeEscrowTimelock {
    /// Queues a winner payout behind a `delay_sec` timelock (e.g. 3600 for
    /// a 1-hour challenge window). `arbiter` is the address empowered to
    /// freeze/resolve this specific payout during the window; typically
    /// the tournament's designated anti-cheat reviewer. Authorization is
    /// required from `tournament_contract`, since it is the party
    /// vouching for the payout amount and winner.
    pub fn queue_payout(
        env: Env,
        tournament_contract: Address,
        arbiter: Address,
        winner: Address,
        amount: u128,
        delay_sec: u64,
    ) -> Result<u64, Error> {
        tournament_contract.require_auth();

        if amount == 0 {
            return Err(Error::InvalidAmount);
        }
        if delay_sec == 0 {
            return Err(Error::InvalidDelay);
        }

        let payout_id = storage::get_next_payout_id(&env);
        storage::set_next_payout_id(&env, payout_id + 1);

        let now = env.ledger().timestamp();
        let payout = QueuedPayout {
            payout_id,
            tournament_contract,
            winner,
            amount,
            queued_at: now,
            unlock_at: now + delay_sec,
            status: PayoutStatus::Pending,
            freeze_reason: None,
        };

        storage::set_payout(&env, &payout);
        storage::set_arbiter(&env, &arbiter, true);
        Ok(payout_id)
    }

    /// Claims a `Pending` payout once its timelock has expired with no
    /// active freeze. Returns the escrowed amount owed (bookkeeping-only).
    pub fn claim_payout(env: Env, payout_id: u64, winner: Address) -> Result<u128, Error> {
        winner.require_auth();

        let mut payout = storage::get_payout(&env, payout_id).ok_or(Error::PayoutNotFound)?;

        if payout.winner != winner {
            return Err(Error::UnauthorizedWinner);
        }
        match payout.status {
            PayoutStatus::Frozen => return Err(Error::PayoutFrozen),
            PayoutStatus::Claimed | PayoutStatus::Redirected => {
                return Err(Error::PayoutAlreadySettled)
            }
            PayoutStatus::Pending => {}
        }
        if env.ledger().timestamp() < payout.unlock_at {
            return Err(Error::TimelockNotExpired);
        }

        payout.status = PayoutStatus::Claimed;
        storage::set_payout(&env, &payout);
        Ok(payout.amount)
    }

    /// Freezes a `Pending` payout, blocking `claim_payout` until an
    /// arbiter resolves it via `resolve_payout`. Only an address that was
    /// designated as arbiter on some payout (via `queue_payout`) may call
    /// this, and it may only freeze payouts before the timelock expires.
    pub fn freeze_payout(
        env: Env,
        arbiter: Address,
        payout_id: u64,
        reason: Symbol,
    ) -> Result<(), Error> {
        arbiter.require_auth();

        if !storage::is_arbiter(&env, &arbiter) {
            return Err(Error::UnauthorizedArbiter);
        }

        let mut payout = storage::get_payout(&env, payout_id).ok_or(Error::PayoutNotFound)?;
        if payout.status != PayoutStatus::Pending {
            return Err(Error::PayoutNotPending);
        }
        if env.ledger().timestamp() >= payout.unlock_at {
            return Err(Error::TimelockNotExpired);
        }

        payout.status = PayoutStatus::Frozen;
        payout.freeze_reason = Some(reason);
        storage::set_payout(&env, &payout);
        Ok(())
    }

    /// Resolves a `Frozen` payout. If `release_to_winner` is true, the
    /// freeze is lifted and the payout returns to `Pending` (claimable
    /// once/if the timelock has since expired). If false, fraud is
    /// confirmed and the payout is redirected back to the tournament pool
    /// (marked `Redirected`; the caller is responsible for crediting the
    /// pool with the amount this call returns).
    pub fn resolve_payout(
        env: Env,
        arbiter: Address,
        payout_id: u64,
        release_to_winner: bool,
    ) -> Result<u128, Error> {
        arbiter.require_auth();

        if !storage::is_arbiter(&env, &arbiter) {
            return Err(Error::UnauthorizedArbiter);
        }

        let mut payout = storage::get_payout(&env, payout_id).ok_or(Error::PayoutNotFound)?;
        if payout.status != PayoutStatus::Frozen {
            return Err(Error::PayoutNotFrozen);
        }

        if release_to_winner {
            payout.status = PayoutStatus::Pending;
            payout.freeze_reason = None;
            storage::set_payout(&env, &payout);
            Ok(0)
        } else {
            payout.status = PayoutStatus::Redirected;
            storage::set_payout(&env, &payout);
            Ok(payout.amount)
        }
    }

    /// Read-only summary of a queued payout's current state.
    pub fn get_payout_status(env: Env, payout_id: u64) -> Result<PayoutSummary, Error> {
        let payout = storage::get_payout(&env, payout_id).ok_or(Error::PayoutNotFound)?;
        Ok(PayoutSummary {
            payout_id: payout.payout_id,
            tournament_contract: payout.tournament_contract,
            winner: payout.winner,
            amount: payout.amount,
            queued_at: payout.queued_at,
            unlock_at: payout.unlock_at,
            status: payout.status,
            freeze_reason: payout.freeze_reason,
        })
    }
}
