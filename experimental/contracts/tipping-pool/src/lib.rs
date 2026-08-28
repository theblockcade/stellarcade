//! Stellarcade Tipping Pool Contract (experimental)
//!
//! Supporters tip individual creators, or batch-tip several creators in one
//! call. Each tip is escrowed from the tipper immediately, a small platform
//! fee is deducted, and the remainder accrues to the creator's withdrawable
//! balance. Creators withdraw their accumulated balance at any time.
//!
//! ## Atomicity
//! `batch_tip` performs one `token::Client::transfer` per instruction. Since
//! a failed transfer (e.g. insufficient tipper balance) panics and aborts
//! the whole host invocation, a batch either fully applies or has no effect
//! at all — there is no partial-batch state to roll back.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, Env, Symbol, Vec};

pub use types::{TipInstruction, TipRecord};

/// Upper bound on the platform fee (10%).
pub const MAX_PLATFORM_FEE_BPS: u32 = 1_000;
/// Upper bound on tips per batch call, to keep the operation bounded.
pub const MAX_BATCH_SIZE: u32 = 50;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidFee = 3,
    InvalidAmount = 4,
    EmptyBatch = 5,
    BatchTooLarge = 6,
    NoBalance = 7,
    MathOverflow = 8,
}

#[contract]
pub struct TippingPool;

#[contractimpl]
impl TippingPool {
    /// One-time setup: admin, the token tips are paid in, and the platform
    /// fee (in basis points) deducted from every tip.
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        platform_fee_bps: u32,
    ) -> Result<(), Error> {
        if storage::read_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        if platform_fee_bps > MAX_PLATFORM_FEE_BPS {
            return Err(Error::InvalidFee);
        }
        env.storage()
            .instance()
            .set(&storage::DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&storage::DataKey::Token, &token);
        env.storage()
            .instance()
            .set(&storage::DataKey::PlatformFeeBps, &platform_fee_bps);
        Ok(())
    }

    /// Tip a single creator `amount`, attaching `memo`. Returns the net
    /// amount credited to the creator after the platform fee.
    pub fn tip_creator(
        env: Env,
        tipper: Address,
        creator: Address,
        amount: i128,
        memo: Symbol,
    ) -> Result<i128, Error> {
        tipper.require_auth();
        if storage::read_admin(&env).is_none() {
            return Err(Error::NotInitialized);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        apply_tip(&env, &tipper, &creator, amount, &memo)
    }

    /// Tip multiple creators in one call. Fails the entire batch (no tips
    /// applied) if any instruction is invalid or any transfer fails.
    pub fn batch_tip(env: Env, tipper: Address, tips: Vec<TipInstruction>) -> Result<(), Error> {
        tipper.require_auth();
        if storage::read_admin(&env).is_none() {
            return Err(Error::NotInitialized);
        }
        if tips.is_empty() {
            return Err(Error::EmptyBatch);
        }
        if tips.len() > MAX_BATCH_SIZE {
            return Err(Error::BatchTooLarge);
        }
        for tip in tips.iter() {
            if tip.amount <= 0 {
                return Err(Error::InvalidAmount);
            }
        }

        for tip in tips.iter() {
            apply_tip(&env, &tipper, &tip.creator, tip.amount, &tip.memo)?;
        }
        Ok(())
    }

    /// Withdraw the caller's full accumulated tip balance. Returns the
    /// amount withdrawn.
    pub fn withdraw_tips(env: Env, creator: Address) -> Result<i128, Error> {
        creator.require_auth();
        if storage::read_admin(&env).is_none() {
            return Err(Error::NotInitialized);
        }

        let balance = storage::read_creator_balance(&env, &creator);
        if balance <= 0 {
            return Err(Error::NoBalance);
        }

        storage::write_creator_balance(&env, &creator, 0);
        token::Client::new(&env, &storage::read_token(&env)).transfer(
            &env.current_contract_address(),
            &creator,
            &balance,
        );
        Ok(balance)
    }

    /// A creator's current withdrawable balance.
    pub fn get_creator_tip_balance(env: Env, creator: Address) -> i128 {
        storage::read_creator_balance(&env, &creator)
    }

    /// The most recent tips received by a creator (oldest to newest, capped
    /// at `storage::MAX_RECENT_TIPS`).
    pub fn get_recent_tips(env: Env, creator: Address) -> Vec<TipRecord> {
        storage::read_recent_tips(&env, &creator)
    }
}

/// Escrow `amount` from `tipper`, deduct the platform fee, credit the net
/// amount to `creator`'s balance, and record the tip. Returns the net
/// amount credited.
fn apply_tip(
    env: &Env,
    tipper: &Address,
    creator: &Address,
    amount: i128,
    memo: &Symbol,
) -> Result<i128, Error> {
    let contract_address = env.current_contract_address();
    token::Client::new(env, &storage::read_token(env)).transfer(tipper, &contract_address, &amount);

    let fee = amount
        .checked_mul(storage::read_platform_fee_bps(env) as i128)
        .ok_or(Error::MathOverflow)?
        / 10_000;
    let net_amount = amount - fee;

    let new_balance = storage::read_creator_balance(env, creator)
        .checked_add(net_amount)
        .ok_or(Error::MathOverflow)?;
    storage::write_creator_balance(env, creator, new_balance);

    storage::push_recent_tip(
        env,
        creator,
        TipRecord {
            tipper: tipper.clone(),
            net_amount,
            memo: memo.clone(),
            timestamp: env.ledger().timestamp(),
        },
    );

    Ok(net_amount)
}
