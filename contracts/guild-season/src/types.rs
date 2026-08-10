#![allow(dead_code)]

use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeasonData {
    pub season_id: u64,
    pub reward_threshold: u64,
    pub starts_at: u64,
    pub ends_at: u64,
    pub guild_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveSeasonSnapshot {
    pub has_active_season: bool,
    pub is_paused: bool,
    pub now: u64,
    pub season_id: u64,
    pub reward_threshold: u64,
    pub starts_at: u64,
    pub ends_at: u64,
    pub guild_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeasonPerformanceSummary {
    pub has_active_season: bool,
    pub is_paused: bool,
    pub season_id: u64,
    pub guild_count: u32,
    pub reward_threshold: u64,
    pub starts_at: u64,
    pub ends_at: u64,
    pub now: u64,
    /// true when the current ledger time falls within [starts_at, ends_at]
    pub is_active: bool,
    /// seconds until season ends (0 if not started or already ended)
    pub seconds_remaining: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TierCutoffAccessor {
    pub has_active_season: bool,
    pub season_id: u64,
    pub reward_threshold: u64,
    /// tier_cutoff_bps: basis-point representation of reward_threshold as a
    /// fraction of guild_count (reward_threshold * 10_000 / guild_count).
    /// 0 when guild_count is 0 or no active season.
    pub tier_cutoff_bps: u32,
    pub guild_count: u32,
}
