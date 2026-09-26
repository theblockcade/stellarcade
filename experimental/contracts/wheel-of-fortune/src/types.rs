//! Shared storage/error/event types for the Wheel of Fortune contract.

use soroban_sdk::{contracterror, contractevent, contracttype, Address, BytesN};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Persistent storage TTL in ledgers (~30 days at 5 s/ledger).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

/// Number of segments on the wheel.
pub const SEGMENT_COUNT: u32 = 8;

/// Multiplier basis (100 == 1.0x). Segment multipliers are expressed as
/// integer basis-100 values so `0.5x` can be represented exactly as `50`.
pub const MULTIPLIER_DIVISOR: i128 = 100;

/// The 8 prize segments, expressed in basis-100 multiplier units:
/// 0x, 0.5x, 1x, 1.5x, 2x, 3x, 5x, 10x.
pub const WHEEL_SEGMENTS: [u32; SEGMENT_COUNT as usize] = [0, 50, 100, 150, 200, 300, 500, 1000];

/// The largest possible payout multiplier (10x), used for bankroll checks.
pub const MAX_MULTIPLIER: i128 = 1000;

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
    InvalidAmount = 4,
    InvalidWagerRange = 5,
    WagerTooLow = 6,
    WagerTooHigh = 7,
    SpinNotFound = 8,
    SpinAlreadySettled = 9,
    Overflow = 10,
    ContractPaused = 11,
    InsufficientBankroll = 12,
    InvalidCommitment = 13,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    // --- instance() ---
    Admin,
    Token,
    MinWager,
    MaxWager,
    Paused,
    /// Monotonically increasing spin counter, doubles as the round nonce.
    SpinNonce,
    /// Running total of tokens currently held in escrow across open spins.
    EscrowTotal,
    /// Running total of tokens reserved as the house bankroll (deposits made
    /// by the admin specifically to back payouts), separate from escrow.
    HouseReserve,
    // --- persistent() ---
    /// Spin record keyed by spin_id.
    Spin(u64),
}

// ---------------------------------------------------------------------------
// Value types
// ---------------------------------------------------------------------------

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum SpinStatus {
    Pending,
    Settled,
}

/// Full record of a single wheel spin, from placement through settlement.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SpinRecord {
    pub spin_id: u64,
    pub player: Address,
    pub wager_amount: i128,
    pub client_seed: BytesN<32>,
    pub nonce: u64,
    pub status: SpinStatus,
    pub segment_index: u32,
    pub multiplier_bp: u32,
    pub payout: i128,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[contractevent]
pub struct SpinPlaced {
    #[topic]
    pub spin_id: u64,
    #[topic]
    pub player: Address,
    pub wager_amount: i128,
}

#[contractevent]
pub struct SpinSettled {
    #[topic]
    pub spin_id: u64,
    #[topic]
    pub player: Address,
    pub segment_index: u32,
    pub multiplier_bp: u32,
    pub payout: i128,
}

#[contractevent]
pub struct Paused {
    #[topic]
    pub admin: Address,
}

#[contractevent]
pub struct Unpaused {
    #[topic]
    pub admin: Address,
}
