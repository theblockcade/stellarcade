#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{ArenaSession, ArenaSessionState, ArenaSessionView, PlayerArenaSessionSummary, PlayerSessionStats};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    GlobalPaused,
    NextSessionId,
    Session(u64),
    PlayerStats(Address),
    ActiveSession(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    ContractPaused = 4,
    InvalidStakeAmount = 5,
    InvalidSessionDuration = 6,
    ActiveSessionExists = 7,
    SessionNotFound = 8,
    SessionNotActive = 9,
    SessionExpired = 10,
    SessionNotExpired = 11,
    Overflow = 12,
}

#[contract]
pub struct ArenaSessions;

#[contractimpl]
impl ArenaSessions {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GlobalPaused, &false);
        env.storage().instance().set(&DataKey::NextSessionId, &0_u64);
        Ok(())
    }

    pub fn set_paused(env: Env, paused: bool) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&DataKey::GlobalPaused, &paused);
        Ok(())
    }

    pub fn start_session(
        env: Env,
        player: Address,
        arena_id: u32,
        stake_amount: i128,
        duration_ledgers: u32,
    ) -> Result<u64, Error> {
        Self::read_admin(&env)?;
        Self::ensure_not_paused(&env)?;
        player.require_auth();

        if stake_amount <= 0 {
            return Err(Error::InvalidStakeAmount);
        }
        if duration_ledgers == 0 {
            return Err(Error::InvalidSessionDuration);
        }

        let current_ledger = env.ledger().sequence();
        if let Some(active_session_id) = storage::get_active_session_id(&env, &player) {
            if let Some(existing) = storage::get_session(&env, active_session_id) {
                if Self::resolved_state(current_ledger, &existing) == ArenaSessionState::Expired {
                    Self::expire_session_record(&env, existing)?;
                } else {
                    return Err(Error::ActiveSessionExists);
                }
            } else {
                storage::clear_active_session_id(&env, &player);
            }
        }

        let session_id = storage::get_next_session_id(&env);
        let expires_at_ledger = current_ledger
            .checked_add(duration_ledgers)
            .ok_or(Error::Overflow)?;

        storage::set_session(
            &env,
            &ArenaSession {
                session_id,
                player: player.clone(),
                arena_id,
                stake_amount,
                started_at_ledger: current_ledger,
                expires_at_ledger,
                completed_at_ledger: None,
                state: ArenaSessionState::Active,
            },
        );
        storage::set_active_session_id(&env, &player, session_id);
        storage::set_next_session_id(&env, session_id.saturating_add(1));

        let mut stats = storage::get_player_stats(&env, &player);
        stats.total_started = stats.total_started.saturating_add(1);
        stats.total_staked = stats
            .total_staked
            .checked_add(stake_amount)
            .ok_or(Error::Overflow)?;
        storage::set_player_stats(&env, &player, &stats);

        Ok(session_id)
    }

    pub fn complete_session(env: Env, player: Address, session_id: u64) -> Result<(), Error> {
        Self::read_admin(&env)?;
        Self::ensure_not_paused(&env)?;
        player.require_auth();

        let mut session = storage::get_session(&env, session_id).ok_or(Error::SessionNotFound)?;
        if session.player != player {
            return Err(Error::NotAuthorized);
        }

        let current_ledger = env.ledger().sequence();
        match Self::resolved_state(current_ledger, &session) {
            ArenaSessionState::Active => {}
            ArenaSessionState::Expired => return Err(Error::SessionExpired),
            _ => return Err(Error::SessionNotActive),
        }

        session.state = ArenaSessionState::Completed;
        session.completed_at_ledger = Some(current_ledger);
        storage::set_session(&env, &session);
        storage::clear_active_session_id(&env, &player);

        let mut stats = storage::get_player_stats(&env, &player);
        stats.completed_count = stats.completed_count.saturating_add(1);
        storage::set_player_stats(&env, &player, &stats);
        Ok(())
    }

    pub fn expire_session(env: Env, session_id: u64) -> Result<(), Error> {
        Self::read_admin(&env)?;
        let session = storage::get_session(&env, session_id).ok_or(Error::SessionNotFound)?;
        let current_ledger = env.ledger().sequence();

        if Self::resolved_state(current_ledger, &session) != ArenaSessionState::Expired {
            return Err(Error::SessionNotExpired);
        }

        Self::expire_session_record(&env, session)
    }

    pub fn session_status(env: Env, session_id: u64) -> ArenaSessionView {
        let paused = Self::is_paused(&env);

        let Some(session) = storage::get_session(&env, session_id) else {
            return ArenaSessionView {
                session_id,
                exists: false,
                paused,
                player: None,
                arena_id: 0,
                stake_amount: 0,
                started_at_ledger: 0,
                expires_at_ledger: 0,
                completed_at_ledger: None,
                state: ArenaSessionState::Missing,
                can_complete: false,
                can_expire: false,
            };
        };

        let current_ledger = env.ledger().sequence();
        let state = Self::resolved_state(current_ledger, &session);
        ArenaSessionView {
            session_id,
            exists: true,
            paused,
            player: Some(session.player.clone()),
            arena_id: session.arena_id,
            stake_amount: session.stake_amount,
            started_at_ledger: session.started_at_ledger,
            expires_at_ledger: session.expires_at_ledger,
            completed_at_ledger: session.completed_at_ledger,
            state,
            can_complete: !paused && state == ArenaSessionState::Active,
            can_expire: session.state == ArenaSessionState::Active
                && current_ledger > session.expires_at_ledger,
        }
    }

    pub fn player_summary(env: Env, player: Address) -> PlayerArenaSessionSummary {
        let paused = Self::is_paused(&env);
        let stats = storage::get_player_stats(&env, &player);
        let next_session_id = storage::get_next_session_id(&env);

        let active_session_id = storage::get_active_session_id(&env, &player).and_then(|value| {
            storage::get_session(&env, value).and_then(|session| {
                if Self::resolved_state(env.ledger().sequence(), &session) == ArenaSessionState::Active
                {
                    Some(value)
                } else {
                    None
                }
            })
        });

        let exists = stats.total_started > 0 || active_session_id.is_some();
        PlayerArenaSessionSummary {
            player,
            exists,
            paused,
            active_session_id,
            total_started: stats.total_started,
            completed_count: stats.completed_count,
            expired_count: stats.expired_count,
            total_staked: stats.total_staked,
            next_session_id,
        }
    }

    fn expire_session_record(env: &Env, mut session: ArenaSession) -> Result<(), Error> {
        if session.state != ArenaSessionState::Active {
            return Err(Error::SessionNotActive);
        }

        session.state = ArenaSessionState::Expired;
        storage::set_session(env, &session);
        storage::clear_active_session_id(env, &session.player);

        let mut stats = storage::get_player_stats(env, &session.player);
        stats.expired_count = stats.expired_count.saturating_add(1);
        storage::set_player_stats(env, &session.player, &stats);
        Ok(())
    }

    fn resolved_state(current_ledger: u32, session: &ArenaSession) -> ArenaSessionState {
        if session.state == ArenaSessionState::Active && current_ledger > session.expires_at_ledger
        {
            ArenaSessionState::Expired
        } else {
            session.state
        }
    }

    fn read_admin(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    fn require_admin(env: &Env) -> Result<Address, Error> {
        let admin = Self::read_admin(env)?;
        admin.require_auth();
        Ok(admin)
    }

    fn is_paused(env: &Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::GlobalPaused)
            .unwrap_or(false)
    }

    fn ensure_not_paused(env: &Env) -> Result<(), Error> {
        if Self::is_paused(env) {
            return Err(Error::ContractPaused);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test;
