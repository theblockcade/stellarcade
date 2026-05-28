//! Stellarcade Staking Rewards Contract
//!
//! Manages epoch-based staking rewards. An admin deposits reward tokens at
//! the start of each epoch. Stakers earn a proportional share of epoch
//! rewards based on their staked amount relative to the total staked
//! snapshot recorded when the epoch begins.
//!
//! ## Read-only accessors
//! - `reward_projection` — returns a deterministic reward preview for a
//!   single staker without mutating state.
//! - `epoch_summary` — returns metadata and accounting totals for the
//!   current epoch. Returns zeroed defaults before any epoch has started.
#![no_std]

mod storage;
mod types;

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
};

pub use types::{EpochState, EpochSummary, RewardProjection, StakerPosition};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Precision multiplier for proportional reward arithmetic.
const PRECISION: i128 = 1_000_000_000_000; // 1e12

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
    InsufficientBalance = 6,
    EpochAlreadyActive = 7,
    NoActiveEpoch = 8,
    EpochNotEnded = 9,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    StakingToken,
    RewardToken,
    CurrentEpochId,
    Epoch(u64),
    Position(Address),
    TotalStaked,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[contractevent]
pub struct EpochStarted {
    #[topic]
    pub epoch_id: u64,
    pub total_rewards: i128,
    pub total_staked_snapshot: i128,
}

#[contractevent]
pub struct Staked {
    #[topic]
    pub staker: Address,
    pub amount: i128,
}

#[contractevent]
pub struct Unstaked {
    #[topic]
    pub staker: Address,
    pub amount: i128,
}

#[contractevent]
pub struct RewardsClaimed {
    #[topic]
    pub staker: Address,
    pub epoch_id: u64,
    pub amount: i128,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct StakingRewards;

#[contractimpl]
impl StakingRewards {
    /// Initialise the staking rewards contract.
    pub fn init(
        env: Env,
        admin: Address,
        staking_token: Address,
        reward_token: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::StakingToken, &staking_token);
        env.storage()
            .instance()
            .set(&DataKey::RewardToken, &reward_token);
        storage::set_total_staked(&env, 0);
        Ok(())
    }

    /// Admin starts a new reward epoch, depositing `total_rewards` tokens.
    ///
    /// Only one epoch may be active at a time. The current total staked
    /// amount is snapshotted for proportional reward calculations.
    pub fn start_epoch(
        env: Env,
        admin: Address,
        total_rewards: i128,
        end_timestamp: u64,
    ) -> Result<u64, Error> {
        let stored_admin = Self::require_admin(&env, &admin)?;
        stored_admin.require_auth();

        if total_rewards <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Enforce at-most-one active epoch
        if let Some(existing) = storage::get_epoch(&env) {
            if existing.is_active {
                return Err(Error::EpochAlreadyActive);
            }
        }

        let next_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CurrentEpochId)
            .map(|id: u64| id.checked_add(1).expect("Overflow"))
            .unwrap_or(0u64);

        let total_staked_snapshot = storage::get_total_staked(&env);

        // Transfer reward tokens from admin into the contract
        let reward_token: Address = env.storage().instance().get(&DataKey::RewardToken).unwrap();
        token::Client::new(&env, &reward_token).transfer(
            &admin,
            env.current_contract_address(),
            &total_rewards,
        );

        let epoch = EpochState {
            epoch_id: next_id,
            start_timestamp: env.ledger().timestamp(),
            end_timestamp,
            total_rewards,
            total_staked_snapshot,
            distributed_rewards: 0,
            is_active: true,
        };
        storage::set_epoch(&env, &epoch);

        EpochStarted {
            epoch_id: next_id,
            total_rewards,
            total_staked_snapshot,
        }
        .publish(&env);

        Ok(next_id)
    }

    /// Stake tokens to participate in the current and future reward epochs.
    pub fn stake(env: Env, staker: Address, amount: i128) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        staker.require_auth();

        let staking_token: Address = env
            .storage()
            .instance()
            .get(&DataKey::StakingToken)
            .unwrap();
        token::Client::new(&env, &staking_token).transfer(
            &staker,
            env.current_contract_address(),
            &amount,
        );

        let mut position = storage::get_position(&env, &staker);
        position.staked_amount = position
            .staked_amount
            .checked_add(amount)
            .ok_or(Error::Overflow)?;
        storage::set_position(&env, &position);

        let new_total = storage::get_total_staked(&env)
            .checked_add(amount)
            .ok_or(Error::Overflow)?;
        storage::set_total_staked(&env, new_total);

        Staked {
            staker: staker.clone(),
            amount,
        }
        .publish(&env);

        Ok(())
    }

    /// Unstake tokens. Forfeits any unclaimed rewards in the active epoch.
    pub fn unstake(env: Env, staker: Address, amount: i128) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        staker.require_auth();

        let mut position = storage::get_position(&env, &staker);
        if amount <= 0 || amount > position.staked_amount {
            return Err(Error::InvalidAmount);
        }

        position.staked_amount = position
            .staked_amount
            .checked_sub(amount)
            .ok_or(Error::Overflow)?;
        storage::set_position(&env, &position);

        let new_total = storage::get_total_staked(&env).saturating_sub(amount);
        storage::set_total_staked(&env, new_total);

        let staking_token: Address = env
            .storage()
            .instance()
            .get(&DataKey::StakingToken)
            .unwrap();
        token::Client::new(&env, &staking_token).transfer(
            &env.current_contract_address(),
            &staker,
            &amount,
        );

        Unstaked {
            staker: staker.clone(),
            amount,
        }
        .publish(&env);

        Ok(())
    }

    /// Claim the staker's proportional share from the current epoch.
    ///
    /// Epoch must be active. Staker receives
    /// `(staked_amount * total_rewards) / total_staked_snapshot` tokens
    /// (integer division; any remainder stays in the contract as
    /// carry-over for the next epoch).
    pub fn claim_rewards(env: Env, staker: Address) -> Result<i128, Error> {
        Self::require_initialized(&env)?;
        staker.require_auth();

        let mut epoch = storage::get_epoch(&env).ok_or(Error::NoActiveEpoch)?;
        if !epoch.is_active {
            return Err(Error::NoActiveEpoch);
        }

        let position = storage::get_position(&env, &staker);
        if position.staked_amount == 0 {
            return Ok(0);
        }
        if epoch.total_staked_snapshot == 0 {
            return Ok(0);
        }

        let claimable = position
            .staked_amount
            .checked_mul(PRECISION)
            .and_then(|v| v.checked_div(epoch.total_staked_snapshot))
            .and_then(|share| share.checked_mul(epoch.total_rewards))
            .and_then(|v| v.checked_div(PRECISION))
            .ok_or(Error::Overflow)?;

        if claimable <= 0 {
            return Ok(0);
        }

        epoch.distributed_rewards = epoch
            .distributed_rewards
            .checked_add(claimable)
            .ok_or(Error::Overflow)?;
        storage::set_epoch(&env, &epoch);

        let mut updated = storage::get_position(&env, &staker);
        updated.last_epoch_id = epoch.epoch_id;
        updated.total_claimed = updated
            .total_claimed
            .checked_add(claimable)
            .ok_or(Error::Overflow)?;
        storage::set_position(&env, &updated);

        let reward_token: Address = env.storage().instance().get(&DataKey::RewardToken).unwrap();
        token::Client::new(&env, &reward_token).transfer(
            &env.current_contract_address(),
            &staker,
            &claimable,
        );

        RewardsClaimed {
            staker: staker.clone(),
            epoch_id: epoch.epoch_id,
            amount: claimable,
        }
        .publish(&env);

        Ok(claimable)
    }

    /// Admin closes the current epoch.
    pub fn end_epoch(env: Env, admin: Address) -> Result<(), Error> {
        let stored_admin = Self::require_admin(&env, &admin)?;
        stored_admin.require_auth();

        let mut epoch = storage::get_epoch(&env).ok_or(Error::NoActiveEpoch)?;
        if !epoch.is_active {
            return Err(Error::NoActiveEpoch);
        }
        epoch.is_active = false;
        storage::set_epoch(&env, &epoch);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Read-only accessors
    // -----------------------------------------------------------------------

    /// Return a deterministic reward projection for a staker.
    ///
    /// Computes the staker's proportional share of current epoch rewards
    /// based on their current staked amount and the epoch's total staked
    /// snapshot. Returns zeroed values when no epoch has been started.
    ///
    /// Rounding: integer division is used throughout; any fractional token
    /// is truncated and remains in the contract as carry-over.
    pub fn reward_projection(env: Env, staker: Address) -> RewardProjection {
        let position = storage::get_position(&env, &staker);

        let Some(epoch) = storage::get_epoch(&env) else {
            return RewardProjection {
                epoch_id: 0,
                staked_amount: position.staked_amount,
                projected_reward: 0,
                total_claimed: position.total_claimed,
                lifetime_projected_total: position.total_claimed,
            };
        };

        let projected_reward = if epoch.total_staked_snapshot > 0 && position.staked_amount > 0 {
            position
                .staked_amount
                .checked_mul(PRECISION)
                .and_then(|v| v.checked_div(epoch.total_staked_snapshot))
                .and_then(|share| share.checked_mul(epoch.total_rewards))
                .and_then(|v| v.checked_div(PRECISION))
                .unwrap_or(0)
        } else {
            0
        };

        let lifetime_projected_total = position.total_claimed.saturating_add(projected_reward);

        RewardProjection {
            epoch_id: epoch.epoch_id,
            staked_amount: position.staked_amount,
            projected_reward,
            total_claimed: position.total_claimed,
            lifetime_projected_total,
        }
    }

    /// Return a summary of the current epoch's accounting state.
    ///
    /// `pending_carry_over` is the portion of epoch rewards not yet claimed.
    /// When no epoch has started all fields return zero or `false`.
    pub fn epoch_summary(env: Env) -> EpochSummary {
        let Some(epoch) = storage::get_epoch(&env) else {
            return EpochSummary {
                epoch_id: 0,
                total_rewards: 0,
                distributed_rewards: 0,
                pending_carry_over: 0,
                total_staked_snapshot: 0,
                is_active: false,
            };
        };

        let pending_carry_over = epoch
            .total_rewards
            .saturating_sub(epoch.distributed_rewards);

        EpochSummary {
            epoch_id: epoch.epoch_id,
            total_rewards: epoch.total_rewards,
            distributed_rewards: epoch.distributed_rewards,
            pending_carry_over,
            total_staked_snapshot: epoch.total_staked_snapshot,
            is_active: epoch.is_active,
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

    fn require_admin(env: &Env, caller: &Address) -> Result<Address, Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        if *caller != admin {
            return Err(Error::NotAuthorized);
        }
        Ok(admin)
    }
}

#[cfg(test)]
mod test;
