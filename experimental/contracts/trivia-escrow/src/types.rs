//! Storage and error types for the trivia-escrow contract.

use soroban_sdk::{contracterror, contracttype, Address, BytesN};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// `entry_fee` must be strictly positive.
    InvalidInput = 1,
    /// `deadline` must be in the future relative to the ledger timestamp.
    InvalidDeadline = 2,
    /// The referenced round_id has no round stored against it.
    RoundNotFound = 3,
    /// The round has already been settled; no further mutation is allowed.
    RoundAlreadySettled = 4,
    /// A commitment was submitted after the round's submission deadline.
    SubmissionClosed = 5,
    /// The caller already submitted a commitment for this round.
    AlreadyCommitted = 6,
    /// No commitment exists for this (round, player) pair.
    CommitmentNotFound = 7,
    /// The caller already revealed their answers for this round.
    AlreadyRevealed = 8,
    /// The revealed answers + salt do not hash to the stored commitment.
    RevealMismatch = 9,
    /// Reveals are only accepted once the submission deadline has passed.
    RevealNotOpen = 10,
    /// `settle_round` may only run once the submission deadline has passed.
    SettlementNotOpen = 11,
    /// Arithmetic overflow/underflow guard.
    Overflow = 12,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

/// Discriminants for all storage keys.
///
/// Instance keys (`RoundCounter`): small contract-lifetime counter, one
/// ledger entry. Persistent keys (`Round`, `Commitment`, `Players`): per-round
/// and per-player data, each with its own TTL bumped on every write.
#[contracttype]
pub enum DataKey {
    // --- instance() ---
    /// Monotonically increasing counter used to mint round ids.
    RoundCounter,
    // --- persistent() ---
    /// Round configuration and running totals, keyed by round_id.
    Round(u64),
    /// A single player's commitment/reveal state for a round.
    Commitment(u64, Address),
    /// List of player addresses who have committed to a round, used to
    /// iterate participants at settlement time.
    Players(u64),
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/// On-chain configuration and running state for a trivia round.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TriviaRound {
    /// Address that created the round (informational; not privileged beyond
    /// creation since settlement is permissionless once the deadline lapses).
    pub host: Address,
    /// SEP-41 token contract used for stakes and payouts.
    pub token: Address,
    /// Amount each player stakes to participate.
    pub entry_fee: i128,
    /// SHA-256 hash of the canonical, salt-free serialization of the correct
    /// answers. See the README "Scoring model" section for the exact byte
    /// layout used to compute this hash off-chain.
    pub answer_key_hash: BytesN<32>,
    /// Ledger timestamp (seconds) after which no new commitments are
    /// accepted and reveals become possible.
    pub deadline: u64,
    /// Sum of all entry fees collected so far for this round.
    pub total_pool: i128,
    /// Number of players who have submitted a commitment.
    pub player_count: u32,
    /// `true` once `settle_round` has run for this round.
    pub settled: bool,
}

/// A single player's commit/reveal state for one round.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerCommitment {
    /// SHA-256 commitment supplied at submission time.
    pub commitment: BytesN<32>,
    /// `true` once the player has successfully revealed matching answers.
    pub revealed: bool,
    /// `true` if the revealed answers hashed to the round's `answer_key_hash`
    /// (i.e. the player answered every question correctly).
    pub correct: bool,
}

/// Read-only snapshot of a round, suitable for a single-call UI render.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TriviaRoundSummary {
    pub found: bool,
    pub round_id: u64,
    pub host: Address,
    pub token: Address,
    pub entry_fee: i128,
    pub answer_key_hash: BytesN<32>,
    pub deadline: u64,
    pub total_pool: i128,
    pub player_count: u32,
    pub settled: bool,
}
