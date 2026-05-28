#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, Symbol, Vec};

pub use types::{ActiveMapCycleSnapshot, NextRotation};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    CurrentMap,
    MapRotation,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
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
}

#[cfg(test)]
mod test;