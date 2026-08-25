use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BountyStatus {
    Open,
    Claimed,
    Submitted,
    Approved,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyRecord {
    pub bounty_id: u64,
    pub creator: Address,
    pub hunter: Option<Address>,
    pub reward_amount: u128,
    pub deadline: u64,
    pub desc_hash: BytesN<32>,
    pub proof_hash: Option<BytesN<32>>,
    pub submitted_at: u64,
    pub review_window: u64,
    pub status: BountyStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountySummary {
    pub bounty_id: u64,
    pub creator: Address,
    pub hunter: Option<Address>,
    pub reward_amount: u128,
    pub deadline: u64,
    pub desc_hash: BytesN<32>,
    pub proof_hash: Option<BytesN<32>>,
    pub submitted_at: u64,
    pub review_window: u64,
    pub status: BountyStatus,
}
