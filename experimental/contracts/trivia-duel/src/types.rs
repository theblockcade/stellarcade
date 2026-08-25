//! Shared data types for the trivia duel contract.

use soroban_sdk::{contracttype, Address, BytesN};

/// Lifecycle state of a duel.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DuelStatus {
    /// Host has escrowed a wager and is waiting for an opponent.
    AwaitingChallenger = 0,
    /// Both wagers escrowed; commit/reveal rounds in progress.
    InProgress = 1,
    /// Scores computed and escrow disbursed.
    Settled = 2,
}

/// Persisted state of one duel.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Duel {
    pub id: u64,
    pub host: Address,
    pub challenger: Option<Address>,
    pub wager: i128,
    pub question_count: u32,
    pub status: DuelStatus,
    /// Ledger timestamp at which the challenger joined (rounds opened).
    pub started_at: u64,
    /// Commits are rejected after this ledger timestamp.
    pub commit_deadline: u64,
}

/// One player's committed (and possibly revealed) answer for a round.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AnswerCommit {
    pub answer_hash: BytesN<32>,
    /// Ledger timestamp of the commitment; drives the speed bonus.
    pub committed_at: u64,
    pub revealed: bool,
    pub answer_val: u32,
}

/// Presence-aware commit slot (custom structs cannot be nested in `Option`
/// within a `contracttype`).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CommitSlot {
    Empty,
    Committed(AnswerCommit),
}

/// Read-only view of a single round used for commitment verification.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoundView {
    pub round_idx: u32,
    pub host_commit: CommitSlot,
    pub challenger_commit: CommitSlot,
    /// Correct answer as recorded by the admin, if published yet.
    pub correct_val: Option<u32>,
}

/// Final outcome of a settled duel.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DuelSettlement {
    pub duel_id: u64,
    pub host_points: u64,
    pub challenger_points: u64,
    /// `None` on an exact points tie (both wagers refunded).
    pub winner: Option<Address>,
    /// Amount paid to the winner (0 on tie).
    pub payout: i128,
    /// Protocol fee retained (0 on tie).
    pub fee: i128,
}
