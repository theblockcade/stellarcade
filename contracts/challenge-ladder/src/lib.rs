#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, Symbol};

pub use types::{
    BracketData, BracketHealthData, BracketHealthSummary, LadderRankingSnapshot, PromotionCutoff,
    TierCutoff,
};

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
        match env.storage().instance().get::<DataKey, BracketHealthData>(&DataKey::BracketHealth(bracket_id)) {
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

    /// Returns a combined ladder ranking snapshot for a bracket (health + cutoff in one call).
    pub fn ladder_ranking_snapshot(env: Env, bracket_id: u32) -> LadderRankingSnapshot {
        let health = storage::get_bracket_health_data(&env, bracket_id);
        let bracket = storage::get_bracket_data(&env, bracket_id);
        match (health, bracket) {
            (Some(h), Some(b)) => LadderRankingSnapshot {
                bracket_id,
                exists: true,
                player_count: h.player_count,
                active_games: h.active_games,
                promotion_threshold: h.promotion_threshold,
                cutoff_score: b.cutoff_score,
                cutoff_rank: b.cutoff_rank,
                next_promotion_time: b.next_promotion_time,
            },
            _ => LadderRankingSnapshot {
                bracket_id,
                exists: false,
                player_count: 0,
                active_games: 0,
                promotion_threshold: 0,
                cutoff_score: 0,
                cutoff_rank: 0,
                next_promotion_time: 0,
            },
        }
    }

    /// Returns tier boundary details for a bracket.
    pub fn tier_cutoff(env: Env, bracket_id: u32) -> TierCutoff {
        let health = storage::get_bracket_health_data(&env, bracket_id);
        let bracket = storage::get_bracket_data(&env, bracket_id);
        match (health, bracket) {
            (Some(h), Some(b)) => TierCutoff {
                bracket_id,
                exists: true,
                cutoff_score: b.cutoff_score,
                cutoff_rank: b.cutoff_rank,
                promotion_threshold: h.promotion_threshold,
                has_capacity: h.player_count < b.cutoff_rank,
            },
            _ => TierCutoff {
                bracket_id,
                exists: false,
                cutoff_score: 0,
                cutoff_rank: 0,
                promotion_threshold: 0,
                has_capacity: false,
            },
        }
    }

    /// Returns the promotion cutoff details for a bracket.
    pub fn promotion_cutoff(env: Env, bracket_id: u32) -> PromotionCutoff {
        match env.storage().instance().get::<DataKey, BracketData>(&DataKey::Bracket(bracket_id)) {
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