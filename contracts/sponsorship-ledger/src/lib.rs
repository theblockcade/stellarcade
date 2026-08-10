#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use crate::storage::{get_commitment, get_schedule, set_commitment, set_schedule};
use crate::types::{
    LedgerBalanceSummary, PartnerCommitment, Release, ReleaseSchedule, RevocationWindow,
};

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

    /// Returns an aggregated balance summary for a partner.
    ///
    /// Missing partners return `exists = false` with zeroed amounts.
    pub fn ledger_balance_summary(env: Env, partner: Address) -> LedgerBalanceSummary {
        match get_commitment(&env, partner.clone()) {
            Some(c) => {
                let release_pct = if c.total_amount == 0 {
                    0u32
                } else {
                    ((c.released_amount * 100) / c.total_amount) as u32
                };
                LedgerBalanceSummary {
                    partner,
                    exists: true,
                    total_amount: c.total_amount,
                    released_amount: c.released_amount,
                    remaining_amount: c.remaining_amount,
                    release_pct,
                    is_active: c.is_active,
                    is_paused: c.is_paused,
                }
            }
            None => LedgerBalanceSummary {
                partner,
                exists: false,
                total_amount: 0,
                released_amount: 0,
                remaining_amount: 0,
                release_pct: 0,
                is_active: false,
                is_paused: false,
            },
        }
    }

    /// Returns the revocation-window state for a partner.
    ///
    /// Reports how many releases are pending vs processed and whether the
    /// commitment can still be revoked. Missing partners return `exists =
    /// false` with zeroed fields.
    pub fn revocation_window(env: Env, partner: Address) -> RevocationWindow {
        let commitment = get_commitment(&env, partner.clone());
        let schedule = get_schedule(&env, partner.clone());

        let (exists, is_active, is_paused, remaining_amount) = match &commitment {
            Some(c) => (true, c.is_active, c.is_paused, c.remaining_amount),
            None => (false, false, false, 0),
        };

        let (pending_release_count, processed_release_count) = match &schedule {
            Some(s) => {
                let mut pending = 0u32;
                let mut processed = 0u32;
                for release in s.releases.iter() {
                    if release.is_processed {
                        processed = processed.saturating_add(1);
                    } else {
                        pending = pending.saturating_add(1);
                    }
                }
                (pending, processed)
            }
            None => (0, 0),
        };

        let can_revoke = exists && is_active && !is_paused && pending_release_count > 0;

        RevocationWindow {
            partner,
            exists,
            is_active,
            is_paused,
            remaining_amount,
            pending_release_count,
            processed_release_count,
            can_revoke,
        }
    }
}
