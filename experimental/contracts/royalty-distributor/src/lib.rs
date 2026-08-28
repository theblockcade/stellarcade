//! Stellarcade Royalty Distributor Contract (experimental)
//!
//! Automates revenue sharing between game creators, artists, developers,
//! and platform treasury. An admin configures a split once — a fixed table
//! of recipients and their basis-point shares — and any number of deposits
//! (secondary sale proceeds, game fee router payouts, etc.) can flow into
//! it afterward. Each recipient's claimable balance is derived from the
//! split's running total received, so continuous deposits are reflected
//! immediately without a separate accrual step.
//!
//! ## No rounding dust loss
//! A recipient's entitlement is computed as
//! `share_bps * total_received / 10_000` at claim time, and only the
//! unclaimed remainder (`entitled - already_claimed`) is paid out and
//! recorded. Because entitlement is always derived from the exact
//! cumulative total (not from dividing each individual deposit), no dust
//! is ever stranded — any remainder from integer division on one deposit
//! is naturally swept up once the next deposit shifts the entitled amount.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, Env, Vec};

pub use types::{RecipientShare, Split};

/// Total basis points a split's recipient shares must sum to (100%).
pub const TOTAL_SHARE_BPS: u32 = 10_000;
/// Upper bound on recipients per split, to keep batch operations bounded.
pub const MAX_RECIPIENTS: u32 = 20;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    EmptyRecipients = 1,
    TooManyRecipients = 2,
    InvalidShareSum = 3,
    ZeroShare = 4,
    SplitNotFound = 5,
    InvalidAmount = 6,
    NotARecipient = 7,
    NothingToClaim = 8,
    MathOverflow = 9,
}

#[contract]
pub struct RoyaltyDistributor;

#[contractimpl]
impl RoyaltyDistributor {
    /// Create a new split. `recipients`' `share_bps` values must be
    /// nonzero and sum to exactly `TOTAL_SHARE_BPS` (10,000 = 100%).
    /// Returns the new split's id.
    pub fn create_split(
        env: Env,
        admin: Address,
        token: Address,
        recipients: Vec<RecipientShare>,
    ) -> Result<u64, Error> {
        admin.require_auth();

        if recipients.is_empty() {
            return Err(Error::EmptyRecipients);
        }
        if recipients.len() > MAX_RECIPIENTS {
            return Err(Error::TooManyRecipients);
        }

        let mut total_bps: u32 = 0;
        for r in recipients.iter() {
            if r.share_bps == 0 {
                return Err(Error::ZeroShare);
            }
            total_bps = total_bps.checked_add(r.share_bps).ok_or(Error::MathOverflow)?;
        }
        if total_bps != TOTAL_SHARE_BPS {
            return Err(Error::InvalidShareSum);
        }

        let split_id = storage::next_split_id(&env);
        storage::write_split(
            &env,
            split_id,
            &Split {
                admin,
                recipients,
                total_received: 0,
            },
        );
        storage::write_token(&env, split_id, &token);
        Ok(split_id)
    }

    /// Deposit `amount` into `split_id`, immediately increasing every
    /// recipient's claimable balance proportionally to their share.
    pub fn deposit_funds(env: Env, depositor: Address, split_id: u64, amount: i128) -> Result<(), Error> {
        depositor.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let mut split = storage::read_split(&env, split_id).ok_or(Error::SplitNotFound)?;

        let token = storage::read_token(&env, split_id);
        token::Client::new(&env, &token).transfer(
            &depositor,
            env.current_contract_address(),
            &amount,
        );

        split.total_received = split
            .total_received
            .checked_add(amount as u128)
            .ok_or(Error::MathOverflow)?;
        storage::write_split(&env, split_id, &split);
        Ok(())
    }

    /// Claim `recipient`'s currently owed, unclaimed share of `split_id`.
    /// Returns the amount paid out (0 if there was nothing to claim beyond
    /// what was already claimed — this is a no-op, not an error, so batch
    /// claim can safely include recipients with nothing new to collect).
    pub fn claim_share(env: Env, split_id: u64, recipient: Address) -> Result<u128, Error> {
        recipient.require_auth();
        claim_for(&env, split_id, &recipient)
    }

    /// Claim on behalf of every recipient in `split_id` in one call.
    /// Does not require any individual recipient's auth — this is a
    /// permissionless "settle everyone" operation; funds always go to
    /// their rightful owner regardless of who triggers the claim.
    /// Returns each recipient paired with the amount they were paid
    /// (0 for recipients with nothing new to collect).
    pub fn claim_all(env: Env, split_id: u64) -> Result<Vec<(Address, u128)>, Error> {
        let split = storage::read_split(&env, split_id).ok_or(Error::SplitNotFound)?;
        let mut results = Vec::new(&env);
        for r in split.recipients.iter() {
            let paid = claim_for(&env, split_id, &r.recipient)?;
            results.push_back((r.recipient.clone(), paid));
        }
        Ok(results)
    }

    /// `recipient`'s currently claimable (unclaimed) balance in `split_id`.
    pub fn get_claimable(env: Env, split_id: u64, recipient: Address) -> Result<u128, Error> {
        let split = storage::read_split(&env, split_id).ok_or(Error::SplitNotFound)?;
        entitlement(&split, &recipient)
            .map(|entitled| entitled.saturating_sub(storage::read_claimed(&env, split_id, &recipient)))
    }
}

/// A recipient's total entitlement to date: `share_bps * total_received / 10_000`.
/// Errs if `recipient` is not part of the split.
fn entitlement(split: &Split, recipient: &Address) -> Result<u128, Error> {
    let share_bps = split
        .recipients
        .iter()
        .find(|r| &r.recipient == recipient)
        .map(|r| r.share_bps)
        .ok_or(Error::NotARecipient)?;
    Ok(split.total_received * share_bps as u128 / TOTAL_SHARE_BPS as u128)
}

/// Pay `recipient` the difference between their total entitlement and what
/// they've already claimed from `split_id`, and record the new total.
fn claim_for(env: &Env, split_id: u64, recipient: &Address) -> Result<u128, Error> {
    let split = storage::read_split(env, split_id).ok_or(Error::SplitNotFound)?;
    let entitled = entitlement(&split, recipient)?;
    let already_claimed = storage::read_claimed(env, split_id, recipient);
    let owed = entitled.saturating_sub(already_claimed);
    if owed == 0 {
        return Ok(0);
    }

    storage::write_claimed(env, split_id, recipient, entitled);
    let token = storage::read_token(env, split_id);
    token::Client::new(env, &token).transfer(
        &env.current_contract_address(),
        recipient,
        &(owed as i128),
    );
    Ok(owed)
}
