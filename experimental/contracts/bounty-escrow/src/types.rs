use soroban_sdk::{contracterror, contractevent, contracttype, Address, BytesN, Symbol};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
pub enum DataKey {
    Oracle,
    Token,
    Initialized,
    NextBountyId,
    Bounty(u64),
    Claim(u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    InvalidInput = 4,
    BountyNotFound = 5,
    ClaimNotFound = 6,
    BountyExpired = 7,
    BountyNotExpired = 8,
    AlreadyClaimed = 9,
    AlreadyRefunded = 10,
    AlreadyCompleted = 11,
    InsufficientRemainingAmount = 12,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum BountyStatus {
    Open = 1,
    ClaimSubmitted = 2,
    PartiallyPaid = 3,
    Completed = 4,
    Refunded = 5,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Bounty {
    pub bounty_id: u64,
    pub sponsor: Address,
    pub target_game: Symbol,
    pub target_score: u64,
    pub total_amount: i128,
    pub remaining_amount: i128,
    pub deadline: u64,
    pub status: BountyStatus,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Claim {
    pub player: Address,
    pub bounty_id: u64,
    pub proof_hash: BytesN<32>,
    pub timestamp: u64,
    pub approved: bool,
}

#[contractevent]
pub struct Initialized {
    pub oracle: Address,
    pub token: Address,
}

#[contractevent]
pub struct BountyPosted {
    pub bounty_id: u64,
    pub sponsor: Address,
    pub target_game: Symbol,
    pub target_score: u64,
    pub amount: i128,
    pub deadline: u64,
}

#[contractevent]
pub struct ClaimSubmitted {
    pub bounty_id: u64,
    pub player: Address,
    pub proof_hash: BytesN<32>,
}

#[contractevent]
pub struct BountyApproved {
    pub bounty_id: u64,
    pub verifier: Address,
    pub player: Address,
    pub payout_amount: i128,
    pub remaining_amount: i128,
}

#[contractevent]
pub struct BountyRefunded {
    pub bounty_id: u64,
    pub sponsor: Address,
    pub amount: i128,
}
