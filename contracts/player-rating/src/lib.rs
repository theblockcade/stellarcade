#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, Symbol};

pub use types::{VolatilitySummary, RecentAdjustmentSnapshot};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    PlayerRating(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    PlayerNotFound = 2,
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
}

#[cfg(test)]
mod test;