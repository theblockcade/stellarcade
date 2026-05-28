//! Stellarcade Daily-Challenges Contract
//!
//! Manages a set of daily challenges with completion tracking, reward claims,
//! and a configurable refresh window.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

pub use types::*;
use storage::{DataKey, PERSISTENT_BUMP};

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, Symbol, Vec};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized  = 1,
    NotInitialized      = 2,
    NotAuthorized       = 3,
    ChallengeNotFound   = 4,
    AlreadyCompleted    = 5,
    AlreadyClaimed      = 6,
    ChallengeExpired    = 7,
    ChallengeInactive   = 8,
    ContractPaused      = 9,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct DailyChallengesContract;

#[contractimpl]
impl DailyChallengesContract {
    // ── Admin ────────────────────────────────────────────────────────────────

    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::ChallengeIds, &Vec::<Symbol>::new(&env));
        Ok(())
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Paused, &paused);
        Ok(())
    }

    /// Configure the refresh interval (in ledgers).
    pub fn set_refresh_interval(
        env: Env,
        admin: Address,
        interval_ledgers: u32,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage()
            .instance()
            .set(&DataKey::RefreshInterval, &interval_ledgers);
        Ok(())
    }

    /// Record that a refresh has just occurred.
    pub fn record_refresh(env: Env, admin: Address) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let current = env.ledger().sequence();
        env.storage()
            .instance()
            .set(&DataKey::LastRefreshAt, &current);
        Ok(())
    }

    /// Register a new daily challenge.
    pub fn add_challenge(
        env: Env,
        admin: Address,
        id: Symbol,
        description: Symbol,
        expires_at: u32,
        reward: i128,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        assert_not_paused(&env)?;

        let challenge = DailyChallenge {
            id: id.clone(),
            description,
            activated_at: env.ledger().sequence(),
            expires_at,
            reward,
            active: true,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Challenge(id.clone()), &challenge);
        env.storage().persistent().extend_ttl(
            &DataKey::Challenge(id.clone()),
            PERSISTENT_BUMP,
            PERSISTENT_BUMP,
        );

        let mut ids: Vec<Symbol> = env
            .storage()
            .instance()
            .get(&DataKey::ChallengeIds)
            .unwrap_or(Vec::new(&env));
        ids.push_back(id);
        env.storage().instance().set(&DataKey::ChallengeIds, &ids);

        Ok(())
    }

    /// Mark a challenge as completed by a player.
    pub fn complete_challenge(
        env: Env,
        player: Address,
        challenge_id: Symbol,
    ) -> Result<(), Error> {
        player.require_auth();
        assert_not_paused(&env)?;

        let challenge: DailyChallenge = env
            .storage()
            .persistent()
            .get(&DataKey::Challenge(challenge_id.clone()))
            .ok_or(Error::ChallengeNotFound)?;

        if !challenge.active {
            return Err(Error::ChallengeInactive);
        }

        let current = env.ledger().sequence();
        if challenge.expires_at > 0 && current > challenge.expires_at {
            return Err(Error::ChallengeExpired);
        }

        let comp_key = DataKey::Completion(challenge_id.clone(), player.clone());
        if env.storage().persistent().has(&comp_key) {
            return Err(Error::AlreadyCompleted);
        }

        // Store: (completed_at, claimed)
        let record: (u32, bool) = (current, false);
        env.storage().persistent().set(&comp_key, &record);
        env.storage()
            .persistent()
            .extend_ttl(&comp_key, PERSISTENT_BUMP, PERSISTENT_BUMP);

        Ok(())
    }

    /// Claim the reward for a completed challenge.
    pub fn claim_reward(env: Env, player: Address, challenge_id: Symbol) -> Result<i128, Error> {
        player.require_auth();
        assert_not_paused(&env)?;

        let challenge: DailyChallenge = env
            .storage()
            .persistent()
            .get(&DataKey::Challenge(challenge_id.clone()))
            .ok_or(Error::ChallengeNotFound)?;

        let comp_key = DataKey::Completion(challenge_id.clone(), player.clone());
        let record: (u32, bool) = env
            .storage()
            .persistent()
            .get(&comp_key)
            .ok_or(Error::ChallengeNotFound)?;

        if record.1 {
            return Err(Error::AlreadyClaimed);
        }

        let updated: (u32, bool) = (record.0, true);
        env.storage().persistent().set(&comp_key, &updated);
        env.storage()
            .persistent()
            .extend_ttl(&comp_key, PERSISTENT_BUMP, PERSISTENT_BUMP);

        Ok(challenge.reward)
    }

    // ── Read-only views ──────────────────────────────────────────────────────

    /// Return a completion snapshot for a (challenge, player) pair.
    ///
    /// Zero-state: `exists` false when no record exists.
    pub fn completion_snapshot(
        env: Env,
        challenge_id: Symbol,
        player: Address,
    ) -> CompletionSnapshot {
        let comp_key = DataKey::Completion(challenge_id, player);
        match env
            .storage()
            .persistent()
            .get::<DataKey, (u32, bool)>(&comp_key)
        {
            None => CompletionSnapshot {
                exists: false,
                completed: false,
                completed_at: 0,
                claimed: false,
            },
            Some((completed_at, claimed)) => CompletionSnapshot {
                exists: true,
                completed: true,
                completed_at,
                claimed,
            },
        }
    }

    /// Return refresh window information.
    ///
    /// Zero-state: `configured` false when no interval has been set.
    pub fn refresh_window(env: Env) -> RefreshWindowInfo {
        let interval_ledgers: u32 = match env
            .storage()
            .instance()
            .get(&DataKey::RefreshInterval)
        {
            None => {
                return RefreshWindowInfo {
                    configured: false,
                    interval_ledgers: 0,
                    last_refresh_at: 0,
                    next_refresh_at: 0,
                    ledgers_until_refresh: 0,
                    overdue: false,
                }
            }
            Some(v) => v,
        };

        let last_refresh_at: u32 = env
            .storage()
            .instance()
            .get(&DataKey::LastRefreshAt)
            .unwrap_or(0);

        let next_refresh_at = last_refresh_at.saturating_add(interval_ledgers);
        let current = env.ledger().sequence();
        let overdue = current >= next_refresh_at;
        let ledgers_until_refresh = if overdue {
            0
        } else {
            next_refresh_at.saturating_sub(current)
        };

        RefreshWindowInfo {
            configured: true,
            interval_ledgers,
            last_refresh_at,
            next_refresh_at,
            ledgers_until_refresh,
            overdue,
        }
    }

    /// Return a list of all challenge ids.
    pub fn get_challenge_ids(env: Env) -> Vec<Symbol> {
        env.storage()
            .instance()
            .get(&DataKey::ChallengeIds)
            .unwrap_or(Vec::new(&env))
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    caller.require_auth();
    if caller != &admin {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

fn assert_not_paused(env: &Env) -> Result<(), Error> {
    if env
        .storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
    {
        return Err(Error::ContractPaused);
    }
    Ok(())
}

#[cfg(test)]
mod test;
