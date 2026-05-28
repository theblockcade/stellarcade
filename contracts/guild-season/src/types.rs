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
