#![no_std]

pub mod types;
pub mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env};
use crate::types::{Config, PendingClaimSnapshot, RolloverPressure, ValidationDelayAccessor};
use crate::storage::{get_config, get_pending_claim, get_rollover_pressure as get_rp, get_validation_delay, set_validation_delay};

#[contract]
pub struct BadgeClaimsV2;

#[contractimpl]
impl BadgeClaimsV2 {
    /// Returns a structured snapshot of a user's pending claims.
    /// 
    /// # Fallback and Zero-State Behavior
    /// If the contract is not initialized or the user has no claims, returns `pending_amount = 0`.
    /// `is_paused` defaults to `true` when uninitialized to prevent accidental state progression.
    /// 
    /// # Rounding Conventions
    /// Amounts are returned in their base integer units (i128) with no implicit decimal rounding.
    pub fn get_pending_claim_snapshot(env: Env, user: Address) -> PendingClaimSnapshot {
        let is_paused = get_config(&env).map(|c| c.is_paused).unwrap_or(true);
        let pending_amount = get_pending_claim(&env, &user);
        
        PendingClaimSnapshot {
            user,
            pending_amount,
            is_paused,
            timestamp: env.ledger().timestamp(),
        }
    }

    /// Returns the current rollover pressure for the system.
    ///
    /// # Fallback and Zero-State Behavior
    /// If no rollover pressure has been recorded, returns `total_pressure = 0` and `active_users = 0`.
    ///
    /// # Rounding Conventions
    /// All pressure calculations are performed and returned in base units without truncation.
    pub fn get_rollover_pressure(env: Env) -> RolloverPressure {
        let total_pressure = get_rp(&env);

        RolloverPressure {
            total_pressure,
            active_users: 0,
            timestamp: env.ledger().timestamp(),
        }
    }

    /// Returns the validation delay accessor for a user.
    ///
    /// # Fallback and Zero-State Behavior
    /// If no validation delay has been set for the user, returns `validation_delay_ledger = 0`
    /// and `is_validation_delayed = false`.
    ///
    /// # Rounding Conventions
    /// All ledger calculations are performed in base units without truncation.
    pub fn get_validation_delay_accessor(env: Env, user: Address) -> ValidationDelayAccessor {
        let current_ledger = env.ledger().sequence() as u32;
        let validation_delay_ledger = get_validation_delay(&env, &user).unwrap_or(0);
        let pending_amount = get_pending_claim(&env, &user);

        let is_validation_delayed = if validation_delay_ledger > 0 {
            current_ledger < validation_delay_ledger
        } else {
            false
        };

        let ledgers_until_validation = if validation_delay_ledger > current_ledger {
            validation_delay_ledger - current_ledger
        } else {
            0
        };

        ValidationDelayAccessor {
            user: user.clone(),
            pending_amount,
            validation_delay_ledger,
            current_ledger,
            is_validation_delayed,
            ledgers_until_validation,
        }
    }

    /// Set the validation delay ledger for a user.
    pub fn set_validation_delay(env: Env, user: Address, delay_ledger: u32) {
        set_validation_delay(&env, &user, delay_ledger);
    }
}
