//! Stellarcade Dynamic Bonding Curve Contract (experimental)
//!
//! Continuous token pricing along `price(s) = m * s^k` with exact integer
//! prefix-sum math (`k` in 1..=3), internal deposit accounting, slippage
//! guards on both sides, and read-only quote / reserve-ratio accessors.
//!
//! Deposits and payouts are tracked as internal ledger units per address:
//! this is a pricing prototype, so no external token contract is wired in.
//! `buy_tokens` consumes exactly the curve cost of the minted tokens (the
//! unspent remainder of the deposit is never taken), and `sell_tokens`
//! returns exactly the curve integral over the burned range — so the pool
//! reserve is always the discrete integral of the curve from 0 to supply.

#![no_std]
#![allow(unexpected_cfgs)]

mod math;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env};

pub use types::PoolStatusSummary;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub const MIN_EXPONENT: u32 = 1;
pub const MAX_EXPONENT: u32 = 3;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidSlope = 3,
    InvalidExponent = 4,
    InvalidAmount = 5,
    DepositTooSmall = 6,
    SlippageExceeded = 7,
    InsufficientBalance = 8,
    MathOverflow = 9,
}

#[soroban_sdk::contracttype]
#[derive(Clone)]
pub enum DataKey {
    Slope,
    Exponent,
    Supply,
    Reserve,
    Balance(Address),
}

#[contract]
pub struct DynamicBondingCurve;

#[contractimpl]
impl DynamicBondingCurve {
    /// One-time setup of the curve parameters `price(s) = slope * s^exponent`.
    pub fn initialize(env: Env, slope: u128, exponent: u32) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Slope) {
            return Err(Error::AlreadyInitialized);
        }
        if slope == 0 {
            return Err(Error::InvalidSlope);
        }
        if !(MIN_EXPONENT..=MAX_EXPONENT).contains(&exponent) {
            return Err(Error::InvalidExponent);
        }
        env.storage().instance().set(&DataKey::Slope, &slope);
        env.storage().instance().set(&DataKey::Exponent, &exponent);
        env.storage().instance().set(&DataKey::Supply, &0u128);
        env.storage().instance().set(&DataKey::Reserve, &0u128);
        Ok(())
    }

    /// Mint as many tokens as `deposit_amount` affords at the current curve
    /// position. Only the exact curve cost of those tokens is consumed.
    ///
    /// Aborts with `SlippageExceeded` if fewer than `min_tokens_out` tokens
    /// are affordable (e.g. the price moved after the caller quoted).
    /// Returns the number of tokens minted.
    pub fn buy_tokens(
        env: Env,
        buyer: Address,
        deposit_amount: u128,
        min_tokens_out: u128,
    ) -> Result<u128, Error> {
        buyer.require_auth();
        let (m, k) = curve_params(&env)?;
        if deposit_amount == 0 {
            return Err(Error::InvalidAmount);
        }

        let supply = read_supply(&env);
        let tokens = math::max_tokens_for_deposit(m, k, supply, deposit_amount);
        if tokens == 0 {
            return Err(Error::DepositTooSmall);
        }
        if tokens < min_tokens_out {
            return Err(Error::SlippageExceeded);
        }

        let cost = math::buy_cost(m, k, supply, tokens).ok_or(Error::MathOverflow)?;
        let new_supply = supply.checked_add(tokens).ok_or(Error::MathOverflow)?;
        let new_reserve = read_reserve(&env)
            .checked_add(cost)
            .ok_or(Error::MathOverflow)?;

        env.storage().instance().set(&DataKey::Supply, &new_supply);
        env.storage()
            .instance()
            .set(&DataKey::Reserve, &new_reserve);
        write_balance(&env, &buyer, read_balance(&env, &buyer) + tokens);
        Ok(tokens)
    }

    /// Burn `token_amount` tokens and release their exact curve integral
    /// from the reserve.
    ///
    /// Aborts with `SlippageExceeded` if the return is below
    /// `min_deposit_out`. Returns the deposit amount released.
    pub fn sell_tokens(
        env: Env,
        seller: Address,
        token_amount: u128,
        min_deposit_out: u128,
    ) -> Result<u128, Error> {
        seller.require_auth();
        let (m, k) = curve_params(&env)?;
        if token_amount == 0 {
            return Err(Error::InvalidAmount);
        }

        let balance = read_balance(&env, &seller);
        if token_amount > balance {
            return Err(Error::InsufficientBalance);
        }

        let supply = read_supply(&env);
        let payout = math::sell_return(m, k, supply, token_amount).ok_or(Error::MathOverflow)?;
        if payout < min_deposit_out {
            return Err(Error::SlippageExceeded);
        }

        // Reserve always covers the integral: payout <= reserve by
        // construction, so this subtraction cannot underflow.
        env.storage()
            .instance()
            .set(&DataKey::Supply, &(supply - token_amount));
        env.storage()
            .instance()
            .set(&DataKey::Reserve, &(read_reserve(&env) - payout));
        write_balance(&env, &seller, balance - token_amount);
        Ok(payout)
    }

    /// Quote: tokens minted for `deposit_amount` at the current supply.
    pub fn get_buy_quote(env: Env, deposit_amount: u128) -> Result<u128, Error> {
        let (m, k) = curve_params(&env)?;
        Ok(math::max_tokens_for_deposit(
            m,
            k,
            read_supply(&env),
            deposit_amount,
        ))
    }

    /// Quote: deposit released for selling `token_amount` at the current
    /// supply.
    pub fn get_sell_quote(env: Env, token_amount: u128) -> Result<u128, Error> {
        let (m, k) = curve_params(&env)?;
        math::sell_return(m, k, read_supply(&env), token_amount).ok_or(Error::MathOverflow)
    }

    /// Current pool snapshot including spot price and reserve ratio.
    pub fn get_pool_status(env: Env) -> Result<PoolStatusSummary, Error> {
        let (m, k) = curve_params(&env)?;
        let supply = read_supply(&env);
        let reserve = read_reserve(&env);
        let spot_price = math::spot_price(m, k, supply).ok_or(Error::MathOverflow)?;

        let reserve_ratio_bps = if supply == 0 {
            0
        } else {
            let market_cap = spot_price.checked_mul(supply).ok_or(Error::MathOverflow)?;
            reserve.checked_mul(10_000).ok_or(Error::MathOverflow)? / market_cap
        };

        Ok(PoolStatusSummary {
            supply,
            reserve,
            spot_price,
            reserve_ratio_bps,
            slope: m,
            exponent: k,
        })
    }

    /// Internal token balance held by `owner`.
    pub fn get_balance(env: Env, owner: Address) -> u128 {
        read_balance(&env, &owner)
    }
}

fn curve_params(env: &Env) -> Result<(u128, u32), Error> {
    let m: u128 = env
        .storage()
        .instance()
        .get(&DataKey::Slope)
        .ok_or(Error::NotInitialized)?;
    let k: u32 = env
        .storage()
        .instance()
        .get(&DataKey::Exponent)
        .ok_or(Error::NotInitialized)?;
    Ok((m, k))
}

fn read_supply(env: &Env) -> u128 {
    env.storage().instance().get(&DataKey::Supply).unwrap_or(0)
}

fn read_reserve(env: &Env) -> u128 {
    env.storage().instance().get(&DataKey::Reserve).unwrap_or(0)
}

fn read_balance(env: &Env, owner: &Address) -> u128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(owner.clone()))
        .unwrap_or(0)
}

fn write_balance(env: &Env, owner: &Address, amount: u128) {
    let key = DataKey::Balance(owner.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}
