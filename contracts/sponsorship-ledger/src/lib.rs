#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

pub mod types;
pub mod storage;

#[cfg(test)]
mod test;

use crate::types::{PartnerCommitment, ReleaseSchedule, Release};
use crate::storage::{get_commitment, get_schedule, set_commitment, set_schedule};

#[contract]
pub struct SponsorshipLedger;

#[contractimpl]
impl SponsorshipLedger {
    /// Returns the commitment summary for a partner.
    /// Handles missing states by returning an empty/default commitment.
    pub fn get_partner_commitment(env: Env, partner: Address) -> PartnerCommitment {
        get_commitment(&env, partner.clone()).unwrap_or(PartnerCommitment {
            partner,
            total_amount: 0,
            released_amount: 0,
            remaining_amount: 0,
            last_release_time: 0,
            is_active: false,
            is_paused: false,
        })
    }

    /// Returns the release schedule for a partner.
    /// Handles missing states by returning an empty schedule.
    pub fn get_release_schedule(env: Env, partner: Address) -> ReleaseSchedule {
        get_schedule(&env, partner.clone()).unwrap_or(ReleaseSchedule {
            partner,
            releases: Vec::new(&env),
            total_scheduled: 0,
        })
    }

    /// Internal/Administrative method to initialize or update a commitment.
    /// In a real scenario, this would have access control.
    pub fn update_commitment(env: Env, partner: Address, total_amount: i128, is_active: bool) {
        let mut commitment = get_commitment(&env, partner.clone()).unwrap_or(PartnerCommitment {
            partner: partner.clone(),
            total_amount: 0,
            released_amount: 0,
            remaining_amount: 0,
            last_release_time: 0,
            is_active: false,
            is_paused: false,
        });

        commitment.total_amount = total_amount;
        commitment.remaining_amount = total_amount - commitment.released_amount;
        commitment.is_active = is_active;
        commitment.is_paused = false; // Default to false when updated

        set_commitment(&env, partner, &commitment);
    }

    /// Administrative method to pause/unpause a commitment.
    pub fn set_paused(env: Env, partner: Address, paused: bool) {
        let mut commitment = get_commitment(&env, partner.clone()).expect("Commitment not found");
        commitment.is_paused = paused;
        set_commitment(&env, partner, &commitment);
    }

    /// Internal/Administrative method to set the release schedule.
    pub fn set_release_schedule(env: Env, partner: Address, releases: Vec<Release>) {
        let mut total_scheduled = 0;
        for release in releases.iter() {
            total_scheduled += release.amount;
        }

        let schedule = ReleaseSchedule {
            partner: partner.clone(),
            releases,
            total_scheduled,
        };

        set_schedule(&env, partner, &schedule);
    }
}
