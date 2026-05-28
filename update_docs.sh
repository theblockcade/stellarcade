#!/bin/bash

CONTRACTS=("payout-checkpoints" "arena-reserves" "badge-claims-v2" "ladder-payouts")
STRUCTS=("PayoutCheckpoints" "ArenaReserves" "BadgeClaimsV2" "LadderPayouts")

for i in "${!CONTRACTS[@]}"; do
    C="${CONTRACTS[$i]}"
    S="${STRUCTS[$i]}"

    cat << LIB > contracts/$C/src/lib.rs
#![no_std]

pub mod types;
pub mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env};
use crate::types::{Config, PendingClaimSnapshot, RolloverPressure};
use crate::storage::{get_config, get_pending_claim, get_rollover_pressure as get_rp};

#[contract]
pub struct $S;

#[contractimpl]
impl $S {
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
}
LIB
done
