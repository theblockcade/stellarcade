#![no_std]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

use crate::{
    storage::{get_catalog, get_user_state},
    types::{ActivePerkSummary, UnlockGapSnapshot},
};
pub use types::{PerkCatalog, PerkTier, UserPerkState};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Catalog,
    UserState(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
}

#[contract]
pub struct ProfilePerks;

#[contractimpl]
impl ProfilePerks {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Returns the currently active perk summary for a user profile.
    ///
    /// Empty/missing behavior:
    /// - Not-yet-configured catalogs return `configured = false` with zero-value fields.
    /// - Unknown users default to `points = 0`.
    pub fn active_perk_summary(env: Env, user: Address) -> ActivePerkSummary {
        let points = get_user_state(&env, &user).map(|s| s.points).unwrap_or(0);
        let maybe_catalog = get_catalog(&env);

        let Some(catalog) = maybe_catalog else {
            return ActivePerkSummary {
                user,
                configured: false,
                paused: false,
                points: 0,
                active_perk_id: 0,
                active_perk_required_points: 0,
                next_perk_id: 0,
                next_perk_required_points: 0,
            };
        };

        let mut active_perk_id = 0u32;
        let mut active_required_points = 0u32;
        let mut next_perk_id = 0u32;
        let mut next_required_points = 0u32;

        for tier in catalog.tiers.iter() {
            if points >= tier.required_points {
                active_perk_id = tier.perk_id;
                active_required_points = tier.required_points;
            } else if next_perk_id == 0 {
                next_perk_id = tier.perk_id;
                next_required_points = tier.required_points;
            }
        }

        ActivePerkSummary {
            user,
            configured: true,
            paused: catalog.is_paused,
            points,
            active_perk_id,
            active_perk_required_points: active_required_points,
            next_perk_id,
            next_perk_required_points: next_required_points,
        }
    }

    /// Returns unlock-gap info for the next perk in the active catalog.
    ///
    /// Zero-value conventions:
    /// - Not-yet-configured catalogs return `configured = false`.
    /// - If all perks are unlocked, `points_to_unlock = 0` and `all_perks_unlocked = true`.
    pub fn unlock_gap(env: Env, user: Address) -> UnlockGapSnapshot {
        let summary = Self::active_perk_summary(env, user.clone());

        if !summary.configured {
            return UnlockGapSnapshot {
                user,
                configured: false,
                paused: false,
                points: 0,
                next_perk_id: 0,
                points_to_unlock: 0,
                all_perks_unlocked: false,
            };
        }

        let all_perks_unlocked = summary.next_perk_id == 0;
        let points_to_unlock = if all_perks_unlocked {
            0
        } else {
            summary
                .next_perk_required_points
                .saturating_sub(summary.points)
        };

        UnlockGapSnapshot {
            user,
            configured: true,
            paused: summary.paused,
            points: summary.points,
            next_perk_id: summary.next_perk_id,
            points_to_unlock,
            all_perks_unlocked,
        }
    }
}
