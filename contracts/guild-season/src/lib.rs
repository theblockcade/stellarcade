#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod types;
#[cfg(test)]
mod test;

pub use types::{ActiveSeasonSnapshot, SeasonData, SeasonPerformanceSummary, TierCutoffAccessor};

#[contract]
pub struct GuildSeason;

#[contractimpl]
impl GuildSeason {
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_none() {
            storage::set_admin(&env, &admin);
            storage::set_paused(&env, false);
        }
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_paused(&env, paused);
        }
    }

    pub fn set_active_season(
        env: Env,
        admin: Address,
        season_id: u64,
        reward_threshold: u64,
        starts_at: u64,
        ends_at: u64,
        guild_count: u32,
    ) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_active_season(
                &env,
                &SeasonData {
                    season_id,
                    reward_threshold,
                    starts_at,
                    ends_at,
                    guild_count,
                },
            );
        }
    }

    pub fn active_season_snapshot(env: Env) -> ActiveSeasonSnapshot {
        let now = env.ledger().timestamp();
        if let Some(season) = storage::get_active_season(&env) {
            ActiveSeasonSnapshot {
                has_active_season: true,
                is_paused: storage::is_paused(&env),
                now,
                season_id: season.season_id,
                reward_threshold: season.reward_threshold,
                starts_at: season.starts_at,
                ends_at: season.ends_at,
                guild_count: season.guild_count,
            }
        } else {
            ActiveSeasonSnapshot {
                has_active_season: false,
                is_paused: storage::is_paused(&env),
                now,
                season_id: 0,
                reward_threshold: 0,
                starts_at: 0,
                ends_at: 0,
                guild_count: 0,
            }
        }
    }

    pub fn reward_threshold(env: Env, season_id: u64) -> u64 {
        storage::get_active_season(&env)
            .filter(|s| s.season_id == season_id)
            .map(|s| s.reward_threshold)
            .unwrap_or(0)
    }

    /// Return a performance summary for the active season including whether
    /// the season is currently active (within its time window) and how many
    /// seconds remain until it ends.
    pub fn season_performance_summary(env: Env) -> SeasonPerformanceSummary {
        let now = env.ledger().timestamp();
        if let Some(season) = storage::get_active_season(&env) {
            let is_active = season.starts_at <= now && now <= season.ends_at;
            let seconds_remaining = if is_active {
                season.ends_at.saturating_sub(now)
            } else {
                0
            };
            SeasonPerformanceSummary {
                has_active_season: true,
                is_paused: storage::is_paused(&env),
                season_id: season.season_id,
                guild_count: season.guild_count,
                reward_threshold: season.reward_threshold,
                starts_at: season.starts_at,
                ends_at: season.ends_at,
                now,
                is_active,
                seconds_remaining,
            }
        } else {
            SeasonPerformanceSummary {
                has_active_season: false,
                is_paused: storage::is_paused(&env),
                season_id: 0,
                guild_count: 0,
                reward_threshold: 0,
                starts_at: 0,
                ends_at: 0,
                now,
                is_active: false,
                seconds_remaining: 0,
            }
        }
    }

    /// Return the tier cutoff in basis points: reward_threshold * 10_000 /
    /// guild_count. Returns 0 when there is no active season or guild_count is 0.
    pub fn tier_cutoff_accessor(env: Env) -> TierCutoffAccessor {
        if let Some(season) = storage::get_active_season(&env) {
            let tier_cutoff_bps = if season.guild_count > 0 {
                u32::try_from(
                    (season.reward_threshold as u128 * 10_000) / season.guild_count as u128,
                )
                .unwrap_or(0)
            } else {
                0
            };
            TierCutoffAccessor {
                has_active_season: true,
                season_id: season.season_id,
                reward_threshold: season.reward_threshold,
                tier_cutoff_bps,
                guild_count: season.guild_count,
            }
        } else {
            TierCutoffAccessor {
                has_active_season: false,
                season_id: 0,
                reward_threshold: 0,
                tier_cutoff_bps: 0,
                guild_count: 0,
            }
        }
    }
}
