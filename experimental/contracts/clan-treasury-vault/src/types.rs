//! Core data types for the clan treasury vault contract.

use soroban_sdk::{contracterror, contractevent, contracttype, Address, Symbol, Vec};

/// Timelock delay (in ledgers) that must elapse after a proposal reaches
/// quorum before it can be executed. ~1 hour at 5s/ledger.
pub const EXECUTION_TIMELOCK_LEDGERS: u32 = 720;

/// Persistent storage TTL in ledgers (~30 days at 5 s/ledger).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    InvalidThreshold = 4,
    InvalidInput = 5,
    ProposalNotFound = 6,
    NotAnOfficer = 7,
    AlreadyVoted = 8,
    QuorumNotReached = 9,
    TimelockNotExpired = 10,
    AlreadyExecuted = 11,
    InsufficientBalance = 12,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
pub enum DataKey {
    // --- instance() ---
    Leader,
    Officers,
    Threshold,
    Token,
    Balance,
    ProposalCount,
    // --- persistent() ---
    /// Proposal keyed by proposal_id.
    Proposal(u64),
    /// Officers who have voted "approve" on a given proposal.
    Votes(u64),
}

// ---------------------------------------------------------------------------
// Proposal state
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub id: u64,
    pub proposer: Address,
    pub recipient: Address,
    pub amount: i128,
    pub memo: Symbol,
    /// Ledger sequence at which quorum was first reached. `None` if not yet
    /// reached. Uses `Option` rather than a `0` sentinel because ledger
    /// sequence `0` is a valid (e.g. default test-env) value.
    pub quorum_reached_at: Option<u32>,
    pub executed: bool,
    pub approvals: u32,
}

/// Snapshot of a proposal plus the officers who approved it, for read access.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalView {
    pub proposal: Proposal,
    pub voters: Vec<Address>,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[contractevent]
pub struct VaultInitialized {
    #[topic]
    pub leader: Address,
    pub threshold: u32,
    pub token: Address,
}

#[contractevent]
pub struct Deposited {
    #[topic]
    pub contributor: Address,
    pub amount: i128,
}

#[contractevent]
pub struct ProposalCreated {
    #[topic]
    pub proposal_id: u64,
    #[topic]
    pub proposer: Address,
    pub recipient: Address,
    pub amount: i128,
}

#[contractevent]
pub struct ProposalVoted {
    #[topic]
    pub proposal_id: u64,
    #[topic]
    pub officer: Address,
    pub approve: bool,
    pub approvals: u32,
}

#[contractevent]
pub struct ProposalExecuted {
    #[topic]
    pub proposal_id: u64,
    pub recipient: Address,
    pub amount: i128,
}
