#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, Symbol, Vec};

pub use types::{VolatilitySummary, RecentAdjustmentSnapshot, RatingDistributionSnapshot};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    PlayerRating(Address),
    RatingDistribution,
    UpdateCooldown,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    PlayerNotFound = 2,
    NotAuthorized = 3,
}

#[contract]
pub struct PlayerRating;

#[contractimpl]
impl PlayerRating {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Returns a summary of rating volatility metrics.
    pub fn volatility_summary(env: Env, player: Address) -> VolatilitySummary {
        // For now, return empty state - this would be populated with actual volatility data
        VolatilitySummary {
            player,
            exists: false,
            current_volatility: 0,
            volatility_trend: 0,
            games_played: 0,
        }
    }

    /// Returns a snapshot of recent rating adjustments.
    pub fn recent_adjustment_snapshot(env: Env, player: Address) -> RecentAdjustmentSnapshot {
        // For now, return empty state - this would be populated with actual adjustment data
        RecentAdjustmentSnapshot {
            player,
            exists: false,
            last_adjustment: 0,
            adjustment_count: 0,
            recent_games: Vec::new(&env),
        }
    }

    /// Returns the configured update cooldown (defaults to 0).
    pub fn update_cooldown(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::UpdateCooldown)
            .unwrap_or(0)
    }

    /// Sets the update cooldown. Admin only.
    pub fn set_update_cooldown(env: Env, admin: Address, cooldown: u64) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage()
            .instance()
            .set(&DataKey::UpdateCooldown, &cooldown);
        Ok(())
    }

    /// Returns the current rating distribution snapshot.
    pub fn rating_distribution_snapshot(env: Env) -> RatingDistributionSnapshot {
        env.storage()
            .instance()
            .get(&DataKey::RatingDistribution)
            .unwrap_or(RatingDistributionSnapshot {
                total_players: 0,
                under_1000: 0,
                rating_1000_to_1999: 0,
                rating_2000_and_above: 0,
            })
    }

    /// Sets the rating distribution snapshot. Admin only.
    pub fn set_rating_distribution(
        env: Env,
        admin: Address,
        snapshot: RatingDistributionSnapshot,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage()
            .instance()
            .set(&DataKey::RatingDistribution, &snapshot);
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    caller.require_auth();
    if caller != &admin {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

#[cfg(test)]
mod test;