use soroban_sdk::{contracttype, Address, BytesN, Symbol, Vec};

/// A score threshold and the maximum amount paid for a claim at that tier.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PayoutTier {
    pub min_score: u32,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BountyStatus {
    Open,
    Exhausted,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Bounty {
    pub id: u64,
    pub sponsor: Address,
    pub target_game: Symbol,
    pub deadline: u64,
    pub total_amount: i128,
    pub remaining_amount: i128,
    pub tiers: Vec<PayoutTier>,
    /// A payout tier can be settled at most once.
    pub paid_tiers: Vec<bool>,
    pub next_claim_id: u64,
    pub status: BountyStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Claim {
    pub id: u64,
    pub bounty_id: u64,
    pub player: Address,
    pub score: u32,
    pub tier_index: u32,
    pub proof_hash: BytesN<32>,
    pub payout_amount: i128,
    pub approvals: Vec<Address>,
    pub paid: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub token: Address,
    pub oracles: Vec<Address>,
    pub oracle_threshold: u32,
}
