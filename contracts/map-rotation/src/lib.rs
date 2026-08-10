#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol, Vec};

pub use types::{ActiveMapCycleSnapshot, MapPopularitySnapshot, NextRotation};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MapPopularity {
    pub votes_received: u32,
    pub play_count: u32,
    pub rating_bps: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    CurrentMap,
    MapRotation,
    VoteWindow,
    MapPopularity(Symbol),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    NotAuthorized = 2,
}

#[contract]
pub struct MapRotation;

#[contractimpl]
impl MapRotation {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Returns a snapshot of the current active map cycle.
    pub fn active_map_cycle_snapshot(env: Env) -> ActiveMapCycleSnapshot {
        // For now, return empty state - this would be populated with actual map data
        ActiveMapCycleSnapshot {
            current_map: Symbol::new(&env, "none"),
            cycle_start_time: 0,
            players_active: 0,
            total_maps: 0,
        }
    }

    /// Returns details about the next map rotation.
    pub fn next_rotation(env: Env) -> NextRotation {
        // For now, return empty state - this would be populated with actual rotation data
        NextRotation {
            next_map: Symbol::new(&env, "none"),
            rotation_time: 0,
            time_until_rotation: 0,
            queued_maps: Vec::new(&env),
        }
    }

    /// Returns the configured voting window (defaults to 0 if not set).
    pub fn vote_window(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::VoteWindow)
            .unwrap_or(0)
    }

    /// Set the voting window (in seconds). Admin only.
    pub fn set_vote_window(env: Env, window: u64) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        env.storage().instance().set(&DataKey::VoteWindow, &window);
        Ok(())
    }

    /// Returns popularity stats for a map.
    pub fn map_popularity_snapshot(env: Env, map: Symbol) -> MapPopularitySnapshot {
        let key = DataKey::MapPopularity(map.clone());
        match env
            .storage()
            .persistent()
            .get::<DataKey, MapPopularity>(&key)
        {
            Some(p) => MapPopularitySnapshot {
                map,
                votes_received: p.votes_received,
                play_count: p.play_count,
                rating_bps: p.rating_bps,
            },
            None => MapPopularitySnapshot {
                map,
                votes_received: 0,
                play_count: 0,
                rating_bps: 0,
            },
        }
    }

    /// Increments votes for a map.
    pub fn record_vote(env: Env, map: Symbol) {
        let key = DataKey::MapPopularity(map.clone());
        let mut p = env
            .storage()
            .persistent()
            .get::<DataKey, MapPopularity>(&key)
            .unwrap_or(MapPopularity {
                votes_received: 0,
                play_count: 0,
                rating_bps: 0,
            });
        p.votes_received = p.votes_received.saturating_add(1);
        env.storage().persistent().set(&key, &p);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_AMOUNT, BUMP_AMOUNT);
    }

    /// Increments play counts for a map.
    pub fn record_play(env: Env, map: Symbol) {
        let key = DataKey::MapPopularity(map.clone());
        let mut p = env
            .storage()
            .persistent()
            .get::<DataKey, MapPopularity>(&key)
            .unwrap_or(MapPopularity {
                votes_received: 0,
                play_count: 0,
                rating_bps: 0,
            });
        p.play_count = p.play_count.saturating_add(1);
        env.storage().persistent().set(&key, &p);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_AMOUNT, BUMP_AMOUNT);
    }

    /// Updates the rating of a map.
    pub fn update_rating(env: Env, map: Symbol, rating_bps: u32) {
        let key = DataKey::MapPopularity(map.clone());
        let mut p = env
            .storage()
            .persistent()
            .get::<DataKey, MapPopularity>(&key)
            .unwrap_or(MapPopularity {
                votes_received: 0,
                play_count: 0,
                rating_bps: 0,
            });
        p.rating_bps = rating_bps;
        env.storage().persistent().set(&key, &p);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_AMOUNT, BUMP_AMOUNT);
    }
}

#[cfg(test)]
mod test;
