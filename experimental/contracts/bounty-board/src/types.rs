#![no_std]

use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum BountyStatus {
    Open = 0,
    Claimed = 1,
    Submitted = 2,
    Approved = 3,
    Cancelled = 4,
    TimeoutClaimed = 5,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Bounty {
    pub id: u64,
    pub creator: Address,
    pub hunter: Option<Address>,
    pub reward_amount: i128,
    pub deadline: u64,
    pub desc_hash: BytesN<32>,
    pub proof_hash: Option<BytesN<32>>,
    pub submitted_at: u64,
    pub review_timeout_seconds: u64,
    pub status: BountyStatus,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BountySummary {
    pub id: u64,
    pub creator: Address,
    pub hunter: Option<Address>,
    pub reward_amount: i128,
    pub deadline: u64,
    pub status: BountyStatus,
}
