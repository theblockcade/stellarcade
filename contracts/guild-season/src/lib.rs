#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod types;
#[cfg(test)]
mod test;

pub use types::{ActiveSeasonSnapshot, SeasonData};

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
}
