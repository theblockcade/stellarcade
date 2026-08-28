#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, String};
use types::{ReputationSummary, DECAY_HALF_LIFE_SEC, MAX_SCORE, MIN_SCORE, VOUCH_THRESHOLD};

#[contract]
pub struct DynamicReputationContract;

impl DynamicReputationContract {
    fn compute_decayed_score(score: i32, last_updated: u64, now: u64) -> i32 {
        if score == 0 || now <= last_updated {
            return score;
        }
        let elapsed = now - last_updated;
        let half_lives = elapsed / DECAY_HALF_LIFE_SEC;
        if half_lives == 0 {
            return score;
        }
        let factor = 1 << half_lives.min(10);
        score / (factor as i32)
    }

    fn calculate_tier(score: i32) -> u32 {
        if score < 0 {
            0 // Flagged / Penalty
        } else if score < 100 {
            1 // Basic / Unranked
        } else if score < 300 {
            2 // Trusted
        } else if score < 700 {
            3 // Veteran
        } else {
            4 // Champion
        }
    }
}

#[contractimpl]
impl DynamicReputationContract {
    pub fn record_match_rating(
        env: Env,
        game_contract: Address,
        player: Address,
        score_delta: i32,
        _reason: String,
    ) {
        game_contract.require_auth();

        let now = env.ledger().timestamp();
        let mut rep = storage::get_reputation(&env, &player).unwrap_or(ReputationSummary {
            player: player.clone(),
            raw_score: 0,
            decayed_score: 0,
            last_updated_at: now,
            total_ratings_count: 0,
            vouches_received: 0,
            tier: 1,
        });

        let current_decayed = Self::compute_decayed_score(rep.raw_score, rep.last_updated_at, now);
        let new_score = (current_decayed + score_delta).clamp(MIN_SCORE, MAX_SCORE);

        rep.raw_score = new_score;
        rep.decayed_score = new_score;
        rep.last_updated_at = now;
        rep.total_ratings_count += 1;
        rep.tier = Self::calculate_tier(new_score);

        storage::set_reputation(&env, &rep);
    }

    pub fn vouch_for_player(env: Env, voucher: Address, target_player: Address) {
        voucher.require_auth();

        let now = env.ledger().timestamp();
        let voucher_rep = storage::get_reputation(&env, &voucher).unwrap_or(ReputationSummary {
            player: voucher.clone(),
            raw_score: 0,
            decayed_score: 0,
            last_updated_at: now,
            total_ratings_count: 0,
            vouches_received: 0,
            tier: 1,
        });

        let voucher_decayed = Self::compute_decayed_score(voucher_rep.raw_score, voucher_rep.last_updated_at, now);
        if voucher_decayed < VOUCH_THRESHOLD {
            panic!("voucher reputation is below minimum vouch threshold");
        }

        let mut target_rep = storage::get_reputation(&env, &target_player).unwrap_or(ReputationSummary {
            player: target_player.clone(),
            raw_score: 0,
            decayed_score: 0,
            last_updated_at: now,
            total_ratings_count: 0,
            vouches_received: 0,
            tier: 1,
        });

        let target_decayed = Self::compute_decayed_score(target_rep.raw_score, target_rep.last_updated_at, now);
        let new_score = (target_decayed + 50).clamp(MIN_SCORE, MAX_SCORE);

        target_rep.raw_score = new_score;
        target_rep.decayed_score = new_score;
        target_rep.last_updated_at = now;
        target_rep.vouches_received += 1;
        target_rep.tier = Self::calculate_tier(new_score);

        storage::set_reputation(&env, &target_rep);
    }

    pub fn get_reputation_score(env: Env, player: Address) -> ReputationSummary {
        let now = env.ledger().timestamp();
        let mut rep = storage::get_reputation(&env, &player).unwrap_or(ReputationSummary {
            player: player.clone(),
            raw_score: 0,
            decayed_score: 0,
            last_updated_at: now,
            total_ratings_count: 0,
            vouches_received: 0,
            tier: 1,
        });

        rep.decayed_score = Self::compute_decayed_score(rep.raw_score, rep.last_updated_at, now);
        rep.tier = Self::calculate_tier(rep.decayed_score);
        rep
    }

    pub fn get_reputation_tier(env: Env, player: Address) -> u32 {
        let summary = Self::get_reputation_score(env, player);
        summary.tier
    }
}

#[cfg(test)]
mod test;
