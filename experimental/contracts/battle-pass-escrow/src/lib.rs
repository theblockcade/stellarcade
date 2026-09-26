//! Battle Pass Escrow
//!
//! A seasonal reward escrow contract for StellarCade battle passes. Sponsors
//! fund prize pools, an authorized oracle reports player XP progression, and
//! players claim milestone rewards as they cross XP thresholds.
//!
//! ## Storage Strategy
//! - `instance()`: Oracle address, token address, and initialization flag.
//! - `persistent()`: Season pool data per season_id, and player progress
//!   per (player, season_id). Each is bumped on every write.
//!
//! ## Invariants
//! - The contract can only be initialized once.
//! - Only the authorized oracle may update player XP.
//! - Milestone rewards can only be claimed after the XP threshold is met.
//! - Each milestone can only be claimed once per player per season.
//! - Unclaimed seasonal rewards rollover to the next season pool.
#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, token, Address, Env, Vec};

pub use types::Error;
use types::{
    Funded, Initialized, Milestone, MilestoneClaimed, PlayerProgress, SeasonPool,
    SeasonPoolSummary, SeasonRollover, XPUpdated,
};

#[contract]
pub struct BattlePassEscrow;

#[contractimpl]
impl BattlePassEscrow {
    // -----------------------------------------------------------------------
    // initialize
    // -----------------------------------------------------------------------

    /// Initialize the contract with an authorized oracle and token address.
    /// May only be called once.
    pub fn initialize(env: Env, oracle: Address, token: Address) -> Result<(), Error> {
        if storage::is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }

        oracle.require_auth();

        storage::set_oracle(&env, &oracle);
        storage::set_token(&env, &token);
        storage::set_initialized(&env);

        Initialized { oracle, token }.publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // fund_pass
    // -----------------------------------------------------------------------

    /// Fund a season's escrow pool with tokens. Any address may sponsor a
    /// season by depositing tokens.
    pub fn fund_pass(
        env: Env,
        sponsor: Address,
        season_id: u64,
        amount: i128,
        milestone_rewards: Vec<Milestone>,
    ) -> Result<(), Error> {
        storage::require_initialized(&env)?;
        sponsor.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidInput);
        }

        if milestone_rewards.is_empty() {
            return Err(Error::InvalidInput);
        }

        let token_client = token::Client::new(&env, &storage::get_token(&env));
        let contract_address = env.current_contract_address();
        token_client.transfer(&sponsor, &contract_address, &amount);

        let mut total_rewards: i128 = 0;
        for milestone in milestone_rewards.iter() {
            if milestone.reward_amount <= 0 {
                return Err(Error::InvalidInput);
            }
            total_rewards = total_rewards
                .checked_add(milestone.reward_amount)
                .ok_or(Error::InvalidInput)?;
        }

        if total_rewards > amount {
            return Err(Error::InvalidInput);
        }

        let pool = if storage::has_season_pool(&env, season_id) {
            let mut existing_pool = storage::get_season_pool(&env, season_id)?;
            existing_pool.total_pool = existing_pool
                .total_pool
                .checked_add(amount)
                .ok_or(Error::InvalidInput)?;
            existing_pool
        } else {
            SeasonPool {
                season_id,
                total_pool: amount,
                claimed_amount: 0,
                milestone_rewards,
            }
        };

        storage::set_season_pool(&env, season_id, &pool);

        Funded {
            sponsor,
            season_id,
            amount,
        }
        .publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // update_xp
    // -----------------------------------------------------------------------

    /// Update a player's XP for a season. Only the authorized oracle may call
    /// this function. XP is cumulative and increases by `xp_delta`.
    pub fn update_xp(
        env: Env,
        oracle: Address,
        player: Address,
        season_id: u64,
        xp_delta: u128,
    ) -> Result<(), Error> {
        storage::require_initialized(&env)?;
        oracle.require_auth();

        if oracle != storage::get_oracle(&env) {
            return Err(Error::NotAuthorized);
        }

        if xp_delta == 0 {
            return Err(Error::InvalidInput);
        }

        if !storage::has_season_pool(&env, season_id) {
            return Err(Error::SeasonNotFound);
        }

        let progress = if storage::has_player_progress(&env, &player, season_id) {
            let mut existing = storage::get_player_progress(&env, &player, season_id)?;
            existing.total_xp = existing
                .total_xp
                .checked_add(xp_delta)
                .ok_or(Error::InvalidInput)?;
            existing
        } else {
            PlayerProgress {
                total_xp: xp_delta,
                claimed_milestones: Vec::new(&env),
            }
        };

        let total_xp = progress.total_xp;
        storage::set_player_progress(&env, &player, season_id, &progress);

        XPUpdated {
            oracle,
            player,
            season_id,
            xp_delta,
            total_xp,
        }
        .publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // claim_milestone_reward
    // -----------------------------------------------------------------------

    /// Claim a milestone reward for a player. The player must have reached the
    /// XP threshold for the milestone, and the milestone must not have been
    /// previously claimed.
    pub fn claim_milestone_reward(
        env: Env,
        player: Address,
        season_id: u64,
        milestone_idx: u32,
    ) -> Result<i128, Error> {
        storage::require_initialized(&env)?;
        player.require_auth();

        let pool = storage::get_season_pool(&env, season_id)?;

        if milestone_idx >= pool.milestone_rewards.len() {
            return Err(Error::MilestoneNotFound);
        }

        let progress = storage::get_player_progress(&env, &player, season_id)?;

        let milestone = pool.milestone_rewards.get(milestone_idx).unwrap();

        if progress.total_xp < milestone.xp_threshold {
            return Err(Error::MilestoneNotUnlocked);
        }

        if progress
            .claimed_milestones
            .iter()
            .any(|idx| idx == milestone_idx)
        {
            return Err(Error::AlreadyClaimed);
        }

        let mut updated_progress = progress.clone();
        updated_progress.claimed_milestones.push_back(milestone_idx);
        storage::set_player_progress(&env, &player, season_id, &updated_progress);

        let mut updated_pool = pool.clone();
        updated_pool.claimed_amount = updated_pool
            .claimed_amount
            .checked_add(milestone.reward_amount)
            .ok_or(Error::InvalidInput)?;
        storage::set_season_pool(&env, season_id, &updated_pool);

        let token_client = token::Client::new(&env, &storage::get_token(&env));
        let contract_address = env.current_contract_address();
        token_client.transfer(&contract_address, &player, &milestone.reward_amount);

        MilestoneClaimed {
            player,
            season_id,
            milestone_idx,
            amount: milestone.reward_amount,
        }
        .publish(&env);

        Ok(milestone.reward_amount)
    }

    // -----------------------------------------------------------------------
    // rollover_unclaimed
    // -----------------------------------------------------------------------

    /// Rollover unclaimed rewards from one season to the next. Any address
    /// may trigger this; it moves unclaimed funds to the next season's pool.
    pub fn rollover_unclaimed(env: Env, from_season: u64, to_season: u64) -> Result<(), Error> {
        storage::require_initialized(&env)?;

        let from_pool = storage::get_season_pool(&env, from_season)?;
        let unclaimed = from_pool
            .total_pool
            .checked_sub(from_pool.claimed_amount)
            .ok_or(Error::InvalidInput)?;

        if unclaimed <= 0 {
            return Err(Error::InvalidInput);
        }

        let to_pool = if storage::has_season_pool(&env, to_season) {
            let mut existing = storage::get_season_pool(&env, to_season)?;
            existing.total_pool = existing
                .total_pool
                .checked_add(unclaimed)
                .ok_or(Error::InvalidInput)?;
            existing
        } else {
            return Err(Error::SeasonNotFound);
        };

        storage::set_season_pool(&env, to_season, &to_pool);

        SeasonRollover {
            from_season,
            to_season,
            amount: unclaimed,
        }
        .publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // get_season_pool_stats
    // -----------------------------------------------------------------------

    /// Return summary statistics for a season's pool.
    pub fn get_season_pool_stats(env: Env, season_id: u64) -> Result<SeasonPoolSummary, Error> {
        storage::require_initialized(&env)?;

        let pool = storage::get_season_pool(&env, season_id)?;
        let unclaimed = pool
            .total_pool
            .checked_sub(pool.claimed_amount)
            .ok_or(Error::InvalidInput)?;

        Ok(SeasonPoolSummary {
            season_id: pool.season_id,
            total_pool: pool.total_pool,
            claimed_amount: pool.claimed_amount,
            unclaimed_amount: unclaimed,
            milestone_count: pool.milestone_rewards.len(),
        })
    }

    // -----------------------------------------------------------------------
    // get_player_xp (read helper)
    // -----------------------------------------------------------------------

    /// Return a player's total XP for a season.
    pub fn get_player_xp(env: Env, player: Address, season_id: u64) -> Result<u128, Error> {
        storage::require_initialized(&env)?;

        if !storage::has_player_progress(&env, &player, season_id) {
            return Ok(0);
        }

        let progress = storage::get_player_progress(&env, &player, season_id)?;
        Ok(progress.total_xp)
    }

    // -----------------------------------------------------------------------
    // get_oracle (read helper)
    // -----------------------------------------------------------------------

    /// Return the authorized oracle address.
    pub fn get_oracle(env: Env) -> Address {
        storage::get_oracle(&env)
    }
}
