#![no_std]

mod types;
mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contractevent, Address, Env, contracterror};
use crate::types::{RewardConfig, UserRewardState, RewardSnapshot};
use crate::storage::{get_config, set_config, get_user_state, set_user_state};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    Paused = 4,
    Overflow = 5,
    InsufficientBalance = 6,
}

#[contractevent]
pub struct RewardAccrued {
    #[topic]
    pub user: Address,
    pub amount: i128,
}

#[contractevent]
pub struct RewardClaimed {
    #[topic]
    pub user: Address,
    pub amount: i128,
}

#[contract]
pub struct QueueRewards;

#[contractimpl]
impl QueueRewards {
    /// Initialize the reward contract.
    pub fn init(env: Env, admin: Address, treasury: Address, token: Address) -> Result<(), Error> {
        if get_config(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();

        let config = RewardConfig {
            admin,
            treasury,
            token,
            is_paused: false,
        };
        set_config(&env, &config);
        Ok(())
    }

    /// Set the paused state of the contract. Admin only.
    pub fn set_pause(env: Env, paused: bool) -> Result<(), Error> {
        let mut config = get_config(&env).ok_or(Error::NotInitialized)?;
        config.admin.require_auth();
        config.is_paused = paused;
        set_config(&env, &config);
        Ok(())
    }

    /// Accrue rewards for a user. Restricted to admin/authorized callers.
    pub fn accrue_reward(env: Env, user: Address, amount: i128) -> Result<(), Error> {
        let config = get_config(&env).ok_or(Error::NotInitialized)?;
        if config.is_paused {
            return Err(Error::Paused);
        }
        config.admin.require_auth();

        let mut state = get_user_state(&env, &user).unwrap_or(UserRewardState {
            user: user.clone(),
            total_accrued: 0,
            total_claimed: 0,
            pending_balance: 0,
            last_update_ledger: env.ledger().sequence(),
        });

        state.total_accrued = state.total_accrued.checked_add(amount).ok_or(Error::Overflow)?;
        state.pending_balance = state.pending_balance.checked_add(amount).ok_or(Error::Overflow)?;
        state.last_update_ledger = env.ledger().sequence();

        set_user_state(&env, &user, &state);

        env.events().publish(("reward", "accrued"), RewardAccrued { user, amount });

        Ok(())
    }

    /// Claim all pending rewards for the caller.
    pub fn claim_reward(env: Env, user: Address) -> Result<i128, Error> {
        let config = get_config(&env).ok_or(Error::NotInitialized)?;
        if config.is_paused {
            return Err(Error::Paused);
        }
        user.require_auth();

        let mut state = get_user_state(&env, &user).ok_or(Error::InsufficientBalance)?;
        let amount = state.pending_balance;
        if amount <= 0 {
            return Err(Error::InsufficientBalance);
        }

        // Update state before transfer to prevent re-entry issues (though Soroban handles this)
        state.total_claimed = state.total_claimed.checked_add(amount).ok_or(Error::Overflow)?;
        state.pending_balance = 0;
        state.last_update_ledger = env.ledger().sequence();
        set_user_state(&env, &user, &state);

        // Placeholder for token transfer
        // In reality: token_client.transfer(&config.treasury, &user, &amount);

        env.events().publish(("reward", "claimed"), RewardClaimed { user, amount });

        Ok(amount)
    }

    // ─── Public Read-Only Methods ──────────────────────────────────────────

    /// Returns a complete snapshot of the reward state for a user.
    ///
    /// # Returns
    /// A `RewardSnapshot` containing:
    /// - `config`: Current contract configuration (None if uninitialized).
    /// - `user_state`: User's accrual and claim history (None if no activity).
    /// - `timestamp`: Ledger timestamp of the read.
    ///
    /// # Zero-State Behavior
    /// Returns `None` for internal fields if the contract hasn't been initialized
    /// or the user has never interacted with the rewards system.
    pub fn get_reward_snapshot(env: Env, user: Address) -> RewardSnapshot {
        let config = get_config(&env);
        let user_state = get_user_state(&env, &user);

        RewardSnapshot {
            config,
            user_state,
            timestamp: env.ledger().timestamp(),
            ledger: env.ledger().sequence(),
        }
    }

    /// Directly query user's pending balance.
    ///
    /// # Fallback
    /// Returns 0 for unknown users or users with no pending rewards.
    /// Rounding: No rounding is performed as rewards are tracked in base units.
    pub fn pending_balance(env: Env, user: Address) -> i128 {
        get_user_state(&env, &user)
            .map(|s| s.pending_balance)
            .unwrap_or(0)
    }

    /// Returns whether the contract logic is currently halted.
    ///
    /// # Default behavior
    /// Returns `true` (Halted) if the contract is not yet initialized to prevent
    /// unauthorized interactions.
    pub fn is_paused(env: Env) -> bool {
        get_config(&env).map(|c| c.is_paused).unwrap_or(true)
    }
}
