#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use crate::storage::{
    get_perk, has_claimed, is_queued, mark_claimed, mark_queued, set_perk,
};
use crate::types::{ClaimQueueSnapshot, Perk, ThresholdGap};

#[contract]
pub struct PerkClaims;

#[contractimpl]
impl PerkClaims {
    /// Configures a perk with the queue threshold that must be reached before
    /// claims unlock. Panics if the perk already exists.
    pub fn configure_perk(env: Env, id: u64, threshold: u32) {
        if get_perk(&env, id).is_some() {
            panic!("perk already exists");
        }

        set_perk(
            &env,
            id,
            &Perk {
                id,
                threshold,
                queued_count: 0,
                claimed_count: 0,
                is_active: true,
            },
        );
    }

    /// Adds the caller to the perk's claim queue. Idempotent per user.
    pub fn queue_claim(env: Env, id: u64, user: Address) {
        user.require_auth();

        let mut perk = get_perk(&env, id).expect("perk not found");
        if !perk.is_active {
            panic!("perk is not active");
        }
        if is_queued(&env, id, user.clone()) {
            return;
        }

        perk.queued_count += 1;
        set_perk(&env, id, &perk);
        mark_queued(&env, id, user);
    }

    /// Claims the perk. Requires the threshold to be met, the caller to be
    /// queued, and not to have already claimed.
    pub fn claim(env: Env, id: u64, user: Address) {
        user.require_auth();

        let mut perk = get_perk(&env, id).expect("perk not found");
        if !perk.is_active {
            panic!("perk is not active");
        }
        if perk.queued_count < perk.threshold {
            panic!("claim threshold not met");
        }
        if !is_queued(&env, id, user.clone()) {
            panic!("caller is not queued");
        }
        if has_claimed(&env, id, user.clone()) {
            panic!("already claimed");
        }

        perk.claimed_count += 1;
        set_perk(&env, id, &perk);
        mark_claimed(&env, id, user);
    }

    /// Claim queue snapshot; predictable zero-state when the perk is missing.
    pub fn claim_queue_snapshot(env: Env, id: u64) -> ClaimQueueSnapshot {
        match get_perk(&env, id) {
            Some(p) => ClaimQueueSnapshot {
                perk_exists: true,
                threshold: p.threshold,
                queued_count: p.queued_count,
                claimed_count: p.claimed_count,
                is_threshold_met: p.queued_count >= p.threshold,
            },
            None => ClaimQueueSnapshot {
                perk_exists: false,
                threshold: 0,
                queued_count: 0,
                claimed_count: 0,
                is_threshold_met: false,
            },
        }
    }

    /// Remaining gap to the claim threshold, plus progress in basis points.
    pub fn threshold_gap(env: Env, id: u64) -> ThresholdGap {
        match get_perk(&env, id) {
            Some(p) => {
                let gap = p.threshold.saturating_sub(p.queued_count);
                let progress_bps: u32 = if p.threshold == 0 {
                    10_000
                } else {
                    let raw = (p.queued_count as u64 * 10_000) / p.threshold as u64;
                    if raw > 10_000 {
                        10_000
                    } else {
                        raw as u32
                    }
                };
                ThresholdGap {
                    perk_exists: true,
                    threshold: p.threshold,
                    queued_count: p.queued_count,
                    gap,
                    progress_bps,
                }
            }
            None => ThresholdGap {
                perk_exists: false,
                threshold: 0,
                queued_count: 0,
                gap: 0,
                progress_bps: 0,
            },
        }
    }
}
