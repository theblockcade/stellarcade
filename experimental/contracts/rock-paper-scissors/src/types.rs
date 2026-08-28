//! Shared data types for the rock-paper-scissors duel contract.

use soroban_sdk::{contracttype, Address, BytesN};

/// The move a player commits to and later reveals.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Move {
    Rock = 0,
    Paper = 1,
    Scissors = 2,
}

/// Lifecycle state of a match.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MatchStatus {
    /// Player 1 has escrowed a wager and is waiting for an opponent.
    AwaitingChallenger = 0,
    /// Both wagers escrowed; commit/reveal in progress.
    Committed = 1,
    /// At least one player has revealed; waiting on the other (or timeout).
    Revealed = 2,
    /// Winner evaluated and escrow disbursed.
    Settled = 3,
}

/// One player's committed (and possibly revealed) move.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MoveCommit {
    pub move_hash: BytesN<32>,
    /// Ledger timestamp of the commitment.
    pub committed_at: u64,
    pub revealed: bool,
    pub move_val: Move,
}

/// Presence-aware commit slot (custom structs cannot be nested in `Option`
/// within a `contracttype`).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CommitSlot {
    Empty,
    Committed(MoveCommit),
}

/// Persisted state of one match.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Match {
    pub id: u64,
    pub player1: Address,
    pub player2: Option<Address>,
    pub wager: i128,
    pub status: MatchStatus,
    /// Ledger timestamp at which player2 joined (commit window opened).
    pub started_at: u64,
    /// Commits are rejected after this ledger timestamp.
    pub commit_deadline: u64,
    /// Reveals are rejected after this ledger timestamp (opens once both
    /// players have committed, or the commit deadline passes).
    pub reveal_deadline: u64,
}

/// Full read-only view of a match's commit state, for verification.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchSummary {
    pub id: u64,
    pub player1: Address,
    pub player2: Option<Address>,
    pub wager: i128,
    pub status: MatchStatus,
    pub player1_commit: CommitSlot,
    pub player2_commit: CommitSlot,
}

/// Outcome of a settled match.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchResult {
    pub match_id: u64,
    /// `None` on a tie (both wagers refunded) or a double-forfeit.
    pub winner: Option<Address>,
    /// Amount paid to the winner (0 on tie).
    pub payout: i128,
    /// Protocol fee retained (0 on tie).
    pub fee: i128,
    /// True if settled via reveal-timeout forfeit rather than both reveals.
    pub forfeited: bool,
}
