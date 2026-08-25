//! Storage keys and access helpers for the memory matrix contract.

use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::{GameState, ScoreEntry};

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Monotonic counter used to allocate game ids.
    NextGameId,
    /// Per-player counter mixed into the pattern seed.
    PlayerNonce(Address),
    /// Game round state by id.
    Game(u64),
    /// Best score recorded for a player.
    HighScore(Address),
    /// Global top-score leaderboard (bounded).
    Leaderboard,
}

pub fn next_game_id(env: &Env) -> u64 {
    let key = DataKey::NextGameId;
    let id: u64 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(id + 1));
    id
}

pub fn bump_player_nonce(env: &Env, player: &Address) -> u64 {
    let key = DataKey::PlayerNonce(player.clone());
    let nonce: u64 = env.storage().persistent().get(&key).unwrap_or(0);
    env.storage().persistent().set(&key, &(nonce + 1));
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
    nonce
}

pub fn read_game(env: &Env, game_id: u64) -> Option<GameState> {
    env.storage().persistent().get(&DataKey::Game(game_id))
}

pub fn write_game(env: &Env, game: &GameState) {
    let key = DataKey::Game(game.id);
    env.storage().persistent().set(&key, game);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_high_score(env: &Env, player: &Address) -> u32 {
    env.storage()
        .persistent()
        .get(&DataKey::HighScore(player.clone()))
        .unwrap_or(0)
}

pub fn write_high_score(env: &Env, player: &Address, score: u32) {
    let key = DataKey::HighScore(player.clone());
    env.storage().persistent().set(&key, &score);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_leaderboard(env: &Env) -> Vec<ScoreEntry> {
    env.storage()
        .persistent()
        .get(&DataKey::Leaderboard)
        .unwrap_or_else(|| Vec::new(env))
}

pub fn write_leaderboard(env: &Env, board: &Vec<ScoreEntry>) {
    let key = DataKey::Leaderboard;
    env.storage().persistent().set(&key, board);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}
