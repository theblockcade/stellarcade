#![no_std]

mod types;
mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contractevent, Address, Env, Vec, contracterror};
use crate::types::{MatchConfig, MatchState, MatchStatus, MatchSnapshot, Squad};
use crate::storage::{get_config, set_config, get_match, set_match};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    Paused = 4,
    MatchNotFound = 5,
}

#[contractevent]
pub struct MatchCreated {
    #[topic]
    pub match_id: u32,
    pub creator: Address,
}

#[contract]
pub struct SquadMatch;

#[contractimpl]
impl SquadMatch {
    /// Initialize the squad match contract.
    pub fn init(env: Env, admin: Address, min_players: u32, max_squads: u32) -> Result<(), Error> {
        if get_config(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();

        let config = MatchConfig {
            admin,
            min_players_per_squad: min_players,
            max_squads,
            is_paused: false,
        };
        set_config(&env, &config);
        Ok(())
    }

    /// Set the paused state. Admin only.
    pub fn set_pause(env: Env, paused: bool) -> Result<(), Error> {
        let mut config = get_config(&env).ok_or(Error::NotInitialized)?;
        config.admin.require_auth();
        config.is_paused = paused;
        set_config(&env, &config);
        Ok(())
    }

    /// Create a new squad match.
    pub fn create_match(env: Env, match_id: u32, creator: Address) -> Result<(), Error> {
        let config = get_config(&env).ok_or(Error::NotInitialized)?;
        if config.is_paused {
            return Err(Error::Paused);
        }
        creator.require_auth();

        let state = MatchState {
            match_id,
            squads: Vec::new(&env),
            status: MatchStatus::Pending,
            start_time: env.ledger().timestamp(),
        };

        set_match(&env, match_id, &state);

        env.events().publish(("match", "created"), MatchCreated { match_id, creator });

        Ok(())
    }

    // ─── Public Read-Only Methods ──────────────────────────────────────────

    /// Returns a complete snapshot of a specific match.
    ///
    /// # Returns
    /// A `MatchSnapshot` containing config and state.
    /// Handles missing matches or uninitialized state explicitly.
    pub fn get_match_snapshot(env: Env, match_id: u32) -> MatchSnapshot {
        let config = get_config(&env);
        let match_state = get_match(&env, match_id);

        MatchSnapshot {
            config,
            match_state,
            timestamp: env.ledger().timestamp(),
        }
    }

    /// Returns the status of a specific match.
    /// Returns `Cancelled` as a fallback if the match does not exist.
    pub fn get_match_status(env: Env, match_id: u32) -> MatchStatus {
        get_match(&env, match_id).map(|m| m.status).unwrap_or(MatchStatus::Cancelled)
    }

    /// Returns whether the matchmaking system is paused.
    pub fn is_paused(env: Env) -> bool {
        get_config(&env).map(|c| c.is_paused).unwrap_or(true)
    }
}
