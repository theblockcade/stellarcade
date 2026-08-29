//! Stellarcade Time-Weighted Faucet Contract (experimental)
//!
//! A rate-limited testnet faucet that dispenses a fixed amount of test
//! arcade tokens (e.g. 50 ARCADE) per request, subject to a per-recipient
//! cooldown (e.g. 24 hours) and a global daily dispense cap that resets at
//! the start of each new UTC day (`unix_time / 86_400`). Donors may top up
//! the faucet's tracked reserve at any time.
//!
//! Configuration (drip amount, cooldown, daily cap) is fixed at
//! construction via `initialize` and does not change afterwards, mirroring
//! the immutable-config convention used by sibling contracts in this
//! experimental workspace (see `royalty-distributor`). Like other
//! contracts here, this contract is bookkeeping-only: it tracks the
//! faucet's reserve balance and per-recipient claim history but does not
//! itself move tokens. A caller integrating this contract is responsible
//! for the actual token transfer once `request_drip` reports the amount
//! owed, and for crediting the reserve when calling `refill_faucet`.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env};

pub use types::FaucetSummary;

/// Seconds in a day, used to compute the rolling daily-cap window index.
pub const SECONDS_PER_DAY: u64 = 86_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidDripAmount = 3,
    InvalidCooldown = 4,
    InvalidDailyCap = 5,
    InvalidRefillAmount = 6,
    CooldownNotElapsed = 7,
    InsufficientReserve = 8,
    DailyCapExceeded = 9,
}

#[contract]
pub struct TimeWeightedFaucet;

#[contractimpl]
impl TimeWeightedFaucet {
    /// One-time faucet configuration. `drip_amount` is the fixed payout per
    /// successful `request_drip` call, `cooldown_sec` is the minimum gap a
    /// recipient must wait between successful claims (e.g. 86_400 for 24
    /// hours), and `daily_cap` bounds total tokens dispensed per calendar
    /// day across all recipients.
    pub fn initialize(
        env: Env,
        admin: Address,
        drip_amount: u128,
        cooldown_sec: u64,
        daily_cap: u128,
    ) -> Result<(), Error> {
        admin.require_auth();

        if storage::get_drip_amount(&env) != 0 {
            return Err(Error::AlreadyInitialized);
        }
        if drip_amount == 0 {
            return Err(Error::InvalidDripAmount);
        }
        if cooldown_sec == 0 {
            return Err(Error::InvalidCooldown);
        }
        if daily_cap < drip_amount {
            return Err(Error::InvalidDailyCap);
        }

        storage::set_drip_amount(&env, drip_amount);
        storage::set_cooldown_sec(&env, cooldown_sec);
        storage::set_daily_cap(&env, daily_cap);
        storage::set_reserve_balance(&env, 0);
        storage::set_total_dispensed(&env, 0);
        storage::set_daily_dispensed(&env, 0);
        storage::set_day_index(&env, env.ledger().timestamp() / SECONDS_PER_DAY);
        Ok(())
    }

    /// Tops up the faucet's tracked reserve by `amount` (bookkeeping-only;
    /// see module docs — the donor is responsible for the actual token
    /// transfer into the faucet).
    pub fn refill_faucet(env: Env, donor: Address, amount: u128) -> Result<(), Error> {
        donor.require_auth();

        if storage::get_cooldown_sec(&env) == 0 {
            return Err(Error::NotInitialized);
        }
        if amount == 0 {
            return Err(Error::InvalidRefillAmount);
        }

        let reserve = storage::get_reserve_balance(&env);
        storage::set_reserve_balance(&env, reserve + amount);
        Ok(())
    }

    /// Dispenses `drip_amount` tokens to `recipient`, provided their
    /// cooldown has elapsed, the reserve holds enough tokens, and the
    /// current day's dispense total has not hit `daily_cap`. Returns the
    /// amount dispensed (bookkeeping-only).
    pub fn request_drip(env: Env, recipient: Address) -> Result<u128, Error> {
        recipient.require_auth();

        let drip_amount = storage::get_drip_amount(&env);
        if drip_amount == 0 {
            return Err(Error::NotInitialized);
        }
        let cooldown_sec = storage::get_cooldown_sec(&env);
        let now = env.ledger().timestamp();

        if let Some(last_claim) = storage::get_last_claim(&env, &recipient) {
            if now < last_claim + cooldown_sec {
                return Err(Error::CooldownNotElapsed);
            }
        }

        let reserve = storage::get_reserve_balance(&env);
        if reserve < drip_amount {
            return Err(Error::InsufficientReserve);
        }

        Self::roll_daily_window(&env, now);
        let daily_cap = storage::get_daily_cap(&env);
        let daily_dispensed = storage::get_daily_dispensed(&env);
        if daily_dispensed + drip_amount > daily_cap {
            return Err(Error::DailyCapExceeded);
        }

        storage::set_reserve_balance(&env, reserve - drip_amount);
        storage::set_total_dispensed(&env, storage::get_total_dispensed(&env) + drip_amount);
        storage::set_daily_dispensed(&env, daily_dispensed + drip_amount);
        storage::set_last_claim(&env, &recipient, now);

        Ok(drip_amount)
    }

    /// Seconds remaining before `recipient` may next successfully call
    /// `request_drip`. Returns `0` if the recipient has never claimed or
    /// their cooldown has already elapsed.
    pub fn get_remaining_cooldown(env: Env, recipient: Address) -> u64 {
        let cooldown_sec = storage::get_cooldown_sec(&env);
        let now = env.ledger().timestamp();

        match storage::get_last_claim(&env, &recipient) {
            Some(last_claim) => {
                let unlock_at = last_claim + cooldown_sec;
                if now >= unlock_at {
                    0
                } else {
                    unlock_at - now
                }
            }
            None => 0,
        }
    }

    /// Read-only summary of the faucet's configuration and dispense
    /// totals, including the current daily window's running total.
    pub fn get_faucet_stats(env: Env) -> FaucetSummary {
        FaucetSummary {
            drip_amount: storage::get_drip_amount(&env),
            cooldown_sec: storage::get_cooldown_sec(&env),
            daily_cap: storage::get_daily_cap(&env),
            reserve_balance: storage::get_reserve_balance(&env),
            total_dispensed: storage::get_total_dispensed(&env),
            daily_dispensed: storage::get_daily_dispensed(&env),
            day_index: storage::get_day_index(&env),
        }
    }

    /// Resets the daily dispense counter if `now` has crossed into a new
    /// day since the last recorded `day_index`.
    fn roll_daily_window(env: &Env, now: u64) {
        let current_day = now / SECONDS_PER_DAY;
        if storage::get_day_index(env) != current_day {
            storage::set_day_index(env, current_day);
            storage::set_daily_dispensed(env, 0);
        }
    }
}
