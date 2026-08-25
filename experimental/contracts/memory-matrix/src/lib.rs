//! Stellarcade Memory Matrix Contract (experimental)
//!
//! On-chain memory matrix game: the contract generates a deterministic
//! pseudo-random sequence of grid coordinates from the round seed and a
//! per-player nonce; the player must reproduce the sequence within the
//! round time limit.
//!
//! ## Scoring
//! - Every correct leading step is worth [`POINTS_PER_STEP`].
//! - Reproducing the full pattern adds [`COMPLETION_BONUS`] plus one point
//!   per second left before the deadline (time bonus).
//! - A wrong step terminates the round immediately with `GameStatus::Failed`
//!   and only the correct prefix is scored (no bonuses).
//! - Submissions after the deadline are rejected with `Error::RoundExpired`.
//!
//! ## Verification accessors
//! - `get_round_pattern(game_id)` — the generated coordinate sequence
//!   (cell indices, `row * grid_size + col`).
//! - `get_game_state(game_id)` — round summary without the raw pattern.
//! - `get_high_score(player)` / `get_leaderboard()` — score accessors.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, Vec};

pub use types::{GameResult, GameState, GameStatus, GameSummary, ScoreEntry};

/// Seconds a player has to reproduce the pattern once the round starts.
pub const ROUND_TIME_LIMIT_SECS: u64 = 300;
/// Points awarded per correctly reproduced step.
pub const POINTS_PER_STEP: u32 = 10;
/// Flat bonus for reproducing the entire pattern.
pub const COMPLETION_BONUS: u32 = 50;
/// Number of pattern steps added on top of the base per difficulty level.
pub const STEPS_PER_DIFFICULTY: u32 = 2;
/// Base number of pattern steps at difficulty 1.
pub const BASE_PATTERN_LEN: u32 = 3;
/// Maximum number of entries kept on the global leaderboard.
pub const LEADERBOARD_CAP: u32 = 10;

pub const MIN_GRID_SIZE: u32 = 2;
pub const MAX_GRID_SIZE: u32 = 8;
pub const MIN_DIFFICULTY: u32 = 1;
pub const MAX_DIFFICULTY: u32 = 5;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidGridSize = 1,
    InvalidDifficulty = 2,
    GameNotFound = 3,
    NotGamePlayer = 4,
    RoundClosed = 5,
    RoundExpired = 6,
    EmptySubmission = 7,
}

#[contract]
pub struct MemoryMatrix;

#[contractimpl]
impl MemoryMatrix {
    /// Start a new round for `player`, generating the pattern to memorise.
    ///
    /// Returns the new game id.
    pub fn start_game(
        env: Env,
        player: Address,
        grid_size: u32,
        difficulty: u32,
    ) -> Result<u64, Error> {
        player.require_auth();

        if !(MIN_GRID_SIZE..=MAX_GRID_SIZE).contains(&grid_size) {
            return Err(Error::InvalidGridSize);
        }
        if !(MIN_DIFFICULTY..=MAX_DIFFICULTY).contains(&difficulty) {
            return Err(Error::InvalidDifficulty);
        }

        let id = storage::next_game_id(&env);
        let nonce = storage::bump_player_nonce(&env, &player);
        let started_at = env.ledger().timestamp();

        let seed = round_seed(&env, nonce, id);
        let pattern_len = BASE_PATTERN_LEN + difficulty * STEPS_PER_DIFFICULTY;
        let pattern = generate_pattern(&env, seed, grid_size, pattern_len);

        let game = GameState {
            id,
            player,
            grid_size,
            difficulty,
            pattern,
            started_at,
            deadline: started_at + ROUND_TIME_LIMIT_SECS,
            status: GameStatus::Active,
            score: 0,
        };
        storage::write_game(&env, &game);
        Ok(id)
    }

    /// Submit the player's reproduction of the pattern and grade it.
    ///
    /// The round terminates on the first wrong step (`GameStatus::Failed`).
    /// Submissions after the deadline are rejected without consuming the
    /// round, and submissions to a settled round are rejected.
    pub fn submit_sequence(
        env: Env,
        game_id: u64,
        player: Address,
        sequence_steps: Vec<u32>,
    ) -> Result<GameResult, Error> {
        player.require_auth();

        let mut game = storage::read_game(&env, game_id).ok_or(Error::GameNotFound)?;
        if game.player != player {
            return Err(Error::NotGamePlayer);
        }
        if game.status != GameStatus::Active {
            return Err(Error::RoundClosed);
        }
        if sequence_steps.is_empty() {
            return Err(Error::EmptySubmission);
        }

        let now = env.ledger().timestamp();
        if now > game.deadline {
            return Err(Error::RoundExpired);
        }

        let mut correct_steps: u32 = 0;
        for (i, expected) in game.pattern.iter().enumerate() {
            match sequence_steps.get(i as u32) {
                Some(step) if step == expected => correct_steps += 1,
                _ => break,
            }
        }

        let full_match =
            correct_steps == game.pattern.len() && sequence_steps.len() == game.pattern.len();

        let mut score = correct_steps * POINTS_PER_STEP;
        if full_match {
            let time_bonus = (game.deadline - now) as u32;
            score += COMPLETION_BONUS + time_bonus;
            game.status = GameStatus::Completed;
        } else {
            game.status = GameStatus::Failed;
        }
        game.score = score;
        storage::write_game(&env, &game);

        if score > storage::read_high_score(&env, &player) {
            storage::write_high_score(&env, &player, score);
        }
        record_on_leaderboard(&env, &player, game_id, score);

        Ok(GameResult {
            status: game.status,
            correct_steps,
            score,
        })
    }

    /// Read-only round summary (excludes the raw pattern).
    pub fn get_game_state(env: Env, game_id: u64) -> Result<GameSummary, Error> {
        let game = storage::read_game(&env, game_id).ok_or(Error::GameNotFound)?;
        Ok(GameSummary {
            id: game.id,
            player: game.player,
            grid_size: game.grid_size,
            difficulty: game.difficulty,
            pattern_len: game.pattern.len(),
            started_at: game.started_at,
            deadline: game.deadline,
            status: game.status,
            score: game.score,
        })
    }

    /// Verification accessor: the generated coordinate sequence for a round.
    ///
    /// Cell indices are encoded as `row * grid_size + col`. Note that all
    /// contract storage is public on-chain; this accessor exists so clients
    /// and tests can render and verify the pattern.
    pub fn get_round_pattern(env: Env, game_id: u64) -> Result<Vec<u32>, Error> {
        storage::read_game(&env, game_id)
            .map(|g| g.pattern)
            .ok_or(Error::GameNotFound)
    }

    /// Best score recorded for `player` (0 if the player never scored).
    pub fn get_high_score(env: Env, player: Address) -> u32 {
        storage::read_high_score(&env, &player)
    }

    /// Global top scores, best first, capped at [`LEADERBOARD_CAP`] entries.
    pub fn get_leaderboard(env: Env) -> Vec<ScoreEntry> {
        storage::read_leaderboard(&env)
    }
}

/// Derive the round seed from ledger entropy and per-player state.
fn round_seed(env: &Env, player_nonce: u64, game_id: u64) -> u64 {
    let ledger = env.ledger();
    ledger
        .timestamp()
        .wrapping_mul(0x9E37_79B9_7F4A_7C15)
        .wrapping_add((ledger.sequence() as u64).wrapping_mul(0xBF58_476D_1CE4_E5B9))
        .wrapping_add(player_nonce.wrapping_mul(0x94D0_49BB_1331_11EB))
        .wrapping_add(game_id)
}

/// Deterministic LCG over the seed, mapping each step to a cell index in
/// `[0, grid_size * grid_size)`.
fn generate_pattern(env: &Env, seed: u64, grid_size: u32, len: u32) -> Vec<u32> {
    let cells = (grid_size * grid_size) as u64;
    let mut state = seed;
    let mut pattern = Vec::new(env);
    for _ in 0..len {
        state = state
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        pattern.push_back(((state >> 33) % cells) as u32);
    }
    pattern
}

/// Insert a score into the bounded, descending-sorted global leaderboard.
fn record_on_leaderboard(env: &Env, player: &Address, game_id: u64, score: u32) {
    if score == 0 {
        return;
    }
    let mut board = storage::read_leaderboard(env);
    let mut insert_at = board.len();
    for (i, entry) in board.iter().enumerate() {
        if score > entry.score {
            insert_at = i as u32;
            break;
        }
    }
    if insert_at >= LEADERBOARD_CAP {
        return;
    }
    board.insert(
        insert_at,
        ScoreEntry {
            player: player.clone(),
            game_id,
            score,
        },
    );
    if board.len() > LEADERBOARD_CAP {
        board.pop_back();
    }
    storage::write_leaderboard(env, &board);
}
