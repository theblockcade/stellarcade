#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env};

pub use types::{FeeDeductionSummary, VolumeStats};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAdmin = 3,
    InvalidWager = 4,
    MathOverflow = 5,
}

#[contract]
pub struct DynamicJackpotFee;

#[contractimpl]
impl DynamicJackpotFee {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if storage::read_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        storage::write_admin(&env, &admin);
        let ts = env.ledger().timestamp();
        storage::write_last_reset_timestamp(&env, ts);
        Ok(())
    }

    pub fn route_wager(
        env: Env,
        _game_contract: Address,
        wager_amount: i128,
    ) -> Result<FeeDeductionSummary, Error> {
        if wager_amount <= 0 {
            return Err(Error::InvalidWager);
        }

        let volume = storage::read_total_volume(&env);
        let fee_bps = storage::calculate_fee_bps(volume);

        let fee_amount = (wager_amount * fee_bps as i128) / 10_000;
        let jackpot_share = (fee_amount * storage::JACKPOT_SHARE_BPS as i128) / 10_000;
        let pool_share = fee_amount - jackpot_share;

        let new_volume = volume + wager_amount as u128;
        storage::write_total_volume(&env, new_volume);

        let jackpot_pool = storage::read_jackpot_pool(&env) + jackpot_share;
        storage::write_jackpot_pool(&env, jackpot_pool);

        Ok(FeeDeductionSummary {
            wager_amount,
            fee_bps,
            fee_amount,
            jackpot_amount: jackpot_share,
            pool_amount: pool_share,
        })
    }

    pub fn get_current_fee_bps(env: Env) -> u32 {
        let volume = storage::read_total_volume(&env);
        storage::calculate_fee_bps(volume)
    }

    pub fn get_24h_volume(env: Env) -> u128 {
        storage::read_total_volume(&env)
    }
}
