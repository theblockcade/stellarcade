#![no_std]
#![allow(unexpected_cfgs)]

//! Rank-rewards (#774): admin-configured brackets pay out a flat reward per
//! player; rollovers between seasons are gated by a per-bracket cooldown.
//!
//! - [`Self::bracket_reward_summary`] — population and total reward owed.
//! - [`Self::rollover_readiness_accessor`] — is `user` ready for rollover.

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    BracketConfig, BracketRewardSummary, BracketState, PlayerRecord, RolloverReadiness,
    RolloverReadinessInfo,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Bracket(u32),
    Player(Address),
}

#[contract]
pub struct RankRewards;

#[contractimpl]
impl RankRewards {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create or update a bracket. When the bracket already exists, the
    /// `player_count` and `total_reward_owed` aggregates are preserved.
    /// Changing `reward_per_player` *does not* retroactively re-cost
    /// existing assignments — the aggregate moves only when players are
    /// added or removed.
    pub fn upsert_bracket(
        env: Env,
        admin: Address,
        bracket_id: u32,
        min_rank: u32,
        max_rank: u32,
        reward_per_player: u128,
        rollover_cooldown_secs: u64,
        paused: bool,
    ) {
        require_admin(&env, &admin);
        assert!(min_rank > 0, "min_rank must be positive");
        assert!(max_rank >= min_rank, "invalid rank range");
        assert!(rollover_cooldown_secs > 0, "cooldown must be positive");

        let (player_count, total_reward_owed) = storage::get_bracket(&env, bracket_id)
            .map(|b| (b.player_count, b.total_reward_owed))
            .unwrap_or((0, 0));

        storage::set_bracket(
            &env,
            &BracketConfig {
                bracket_id,
                min_rank,
                max_rank,
                reward_per_player,
                rollover_cooldown_secs,
                player_count,
                total_reward_owed,
                paused,
            },
        );
    }

    /// Assign / refresh a player's rank inside a bracket. Inter-bracket
    /// migration adjusts both brackets' aggregates atomically.
    pub fn set_player_rank(
        env: Env,
        admin: Address,
        user: Address,
        bracket_id: u32,
        rank: u32,
        last_rollover_at: u64,
    ) {
        require_admin(&env, &admin);
        let mut bracket = storage::get_bracket(&env, bracket_id).expect("Bracket not found");
        assert!(!bracket.paused, "Bracket paused");
        assert!(
            rank >= bracket.min_rank && rank <= bracket.max_rank,
            "Rank outside bracket range"
        );

        let previous = storage::get_player(&env, &user);
        match previous {
            Some(prev) if prev.bracket_id == bracket_id => {
                // Same bracket — only update rank/timestamp; aggregates
                // stay put because the player's reward weighting is flat.
            }
            Some(prev) => {
                // Migration: remove from the previous bracket's totals.
                if let Some(mut old) = storage::get_bracket(&env, prev.bracket_id) {
                    old.player_count =
                        old.player_count.checked_sub(1).expect("player underflow");
                    old.total_reward_owed = old
                        .total_reward_owed
                        .checked_sub(old.reward_per_player)
                        .expect("reward underflow");
                    storage::set_bracket(&env, &old);
                }
                bracket.player_count =
                    bracket.player_count.checked_add(1).expect("player overflow");
                bracket.total_reward_owed = bracket
                    .total_reward_owed
                    .checked_add(bracket.reward_per_player)
                    .expect("reward overflow");
            }
            None => {
                bracket.player_count =
                    bracket.player_count.checked_add(1).expect("player overflow");
                bracket.total_reward_owed = bracket
                    .total_reward_owed
                    .checked_add(bracket.reward_per_player)
                    .expect("reward overflow");
            }
        }

        storage::set_bracket(&env, &bracket);
        storage::set_player(
            &env,
            &user,
            &PlayerRecord {
                bracket_id,
                rank,
                last_rollover_at,
            },
        );
    }

    /// Bracket-level summary for the rewards panel.
    pub fn bracket_reward_summary(env: Env, bracket_id: u32) -> BracketRewardSummary {
        let configured = is_configured(&env);
        let Some(bracket) = storage::get_bracket(&env, bracket_id) else {
            return BracketRewardSummary {
                bracket_id,
                configured,
                exists: false,
                state: if configured {
                    BracketState::Missing
                } else {
                    BracketState::NotConfigured
                },
                min_rank: 0,
                max_rank: 0,
                reward_per_player: 0,
                player_count: 0,
                total_reward_owed: 0,
                rollover_cooldown_secs: 0,
            };
        };

        BracketRewardSummary {
            bracket_id,
            configured,
            exists: true,
            state: if bracket.paused {
                BracketState::Paused
            } else {
                BracketState::Active
            },
            min_rank: bracket.min_rank,
            max_rank: bracket.max_rank,
            reward_per_player: bracket.reward_per_player,
            player_count: bracket.player_count,
            total_reward_owed: bracket.total_reward_owed,
            rollover_cooldown_secs: bracket.rollover_cooldown_secs,
        }
    }

    /// Per-player rollover readiness. Missing player → `NoRecord`; missing
    /// bracket → `MissingBracket`; cooldown not yet elapsed → `NotReady`;
    /// elapsed but paused → `BlockedByPause`; otherwise `Ready`.
    pub fn rollover_readiness_accessor(env: Env, user: Address) -> RolloverReadinessInfo {
        let configured = is_configured(&env);
        let now = env.ledger().timestamp();

        let Some(player) = storage::get_player(&env, &user) else {
            return RolloverReadinessInfo {
                configured,
                player_found: false,
                bracket_found: false,
                bracket_id: 0,
                rank: 0,
                last_rollover_at: 0,
                next_rollover_at: 0,
                seconds_until_ready: 0,
                readiness: RolloverReadiness::NoRecord,
                bracket_paused: false,
            };
        };

        let Some(bracket) = storage::get_bracket(&env, player.bracket_id) else {
            return RolloverReadinessInfo {
                configured,
                player_found: true,
                bracket_found: false,
                bracket_id: player.bracket_id,
                rank: player.rank,
                last_rollover_at: player.last_rollover_at,
                next_rollover_at: 0,
                seconds_until_ready: 0,
                readiness: RolloverReadiness::MissingBracket,
                bracket_paused: false,
            };
        };

        let next_rollover_at = player
            .last_rollover_at
            .saturating_add(bracket.rollover_cooldown_secs);
        let seconds_until_ready = next_rollover_at.saturating_sub(now);
        let cooldown_elapsed = now >= next_rollover_at;

        let readiness = if !cooldown_elapsed {
            RolloverReadiness::NotReady
        } else if bracket.paused {
            RolloverReadiness::BlockedByPause
        } else {
            RolloverReadiness::Ready
        };

        RolloverReadinessInfo {
            configured,
            player_found: true,
            bracket_found: true,
            bracket_id: player.bracket_id,
            rank: player.rank,
            last_rollover_at: player.last_rollover_at,
            next_rollover_at,
            seconds_until_ready,
            readiness,
            bracket_paused: bracket.paused,
        }
    }
}

fn is_configured(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

fn require_admin(env: &Env, admin: &Address) {
    admin.require_auth();
    let stored: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    assert!(stored == *admin, "Unauthorized");
}

#[cfg(test)]
mod test;
