#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, Symbol};

pub use types::{BracketHealthSummary, PromotionCutoff, BracketData, BracketHealthData};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Bracket(u32),
    BracketHealth(u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    BracketNotFound = 2,
}

#[contract]
pub struct ChallengeLadder;

#[contractimpl]
impl ChallengeLadder {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Returns a summary of bracket health including player counts and activity levels.
    pub fn bracket_health_summary(env: Env, bracket_id: u32) -> BracketHealthSummary {
        match env.storage().instance().get(&DataKey::BracketHealth(bracket_id)) {
            Some(health_data) => BracketHealthSummary {
                bracket_id,
                exists: true,
                player_count: health_data.player_count,
                active_games: health_data.active_games,
                promotion_threshold: health_data.promotion_threshold,
            },
            None => BracketHealthSummary {
                bracket_id,
                exists: false,
                player_count: 0,
                active_games: 0,
                promotion_threshold: 0,
            },
        }
    }

    /// Returns the promotion cutoff details for a bracket.
    pub fn promotion_cutoff(env: Env, bracket_id: u32) -> PromotionCutoff {
        match env.storage().instance().get(&DataKey::Bracket(bracket_id)) {
            Some(bracket_data) => PromotionCutoff {
                bracket_id,
                exists: true,
                cutoff_score: bracket_data.cutoff_score,
                cutoff_rank: bracket_data.cutoff_rank,
                next_promotion_time: bracket_data.next_promotion_time,
            },
            None => PromotionCutoff {
                bracket_id,
                exists: false,
                cutoff_score: 0,
                cutoff_rank: 0,
                next_promotion_time: 0,
            },
        }
    }
}

#[cfg(test)]
mod test;