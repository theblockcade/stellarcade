use soroban_sdk::{contracterror, contracttype, Address};

/// Ledgers after `report_outcome` before challenges are rejected (~1 hour at 5s/ledger).
pub const CHALLENGE_WINDOW_LEDGERS: u32 = 720;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Token,
    Arbiter,
    Market(u64),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MarketPhase {
    Open,
    Reported,
    Disputed,
    Finalized,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MarketDispute {
    pub oracle: Address,
    pub reported_outcome: bool,
    pub challenge_deadline_ledger: u32,
    pub oracle_bond: i128,
    pub challenger: Option<Address>,
    pub challenge_bond: i128,
    pub final_outcome: Option<bool>,
    pub phase: MarketPhase,
    pub pool: i128,
    pub payout_claimed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeStatusSummary {
    pub found: bool,
    pub phase: MarketPhase,
    pub challenge_deadline_ledger: u32,
    pub disputed: bool,
    pub final_outcome: Option<bool>,
    pub payouts_frozen: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    MarketNotFound = 4,
    InvalidBond = 5,
    ChallengeWindowClosed = 6,
    ChallengeWindowOpen = 7,
    NotDisputed = 8,
    AlreadyFinalized = 9,
    PayoutsFrozen = 10,
    AlreadyClaimed = 11,
    NothingToClaim = 12,
}
