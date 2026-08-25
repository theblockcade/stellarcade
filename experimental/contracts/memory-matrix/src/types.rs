//! Shared data types for the memory matrix game contract.

use soroban_sdk::{contracttype, Address, Vec};

/// Lifecycle state of a single memory matrix round.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum GameStatus {
    /// Pattern generated, waiting for the player's sequence submission.
    Active = 0,
    /// Player reproduced the full pattern within the time limit.
    Completed = 1,
    /// Player submitted a wrong step; round terminated immediately.
    Failed = 2,
}

/// Full persisted state for one game round.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GameState {
    pub id: u64,
    pub player: Address,
    pub grid_size: u32,
    pub difficulty: u32,
    /// Cell indices (row * grid_size + col) the player must reproduce in order.
    pub pattern: Vec<u32>,
    pub started_at: u64,
    /// Ledger timestamp after which submissions are rejected.
    pub deadline: u64,
    pub status: GameStatus,
    pub score: u32,
}

/// Outcome returned from a sequence submission.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GameResult {
    pub status: GameStatus,
    /// Number of leading steps that matched the generated pattern.
    pub correct_steps: u32,
    pub score: u32,
}

/// Read-only projection of a game round for external callers.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GameSummary {
    pub id: u64,
    pub player: Address,
    pub grid_size: u32,
    pub difficulty: u32,
    pub pattern_len: u32,
    pub started_at: u64,
    pub deadline: u64,
    pub status: GameStatus,
    pub score: u32,
}

/// One entry on the global round leaderboard.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScoreEntry {
    pub player: Address,
    pub game_id: u64,
    pub score: u32,
}
