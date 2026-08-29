//! Shared data types for the sealed-bid (blind) auction contract.

use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum AuctionStage {
    Bidding = 0,
    Reveal = 1,
    Settled = 2,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum BidStatus {
    Committed = 0,
    Revealed = 1,
    Invalid = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Auction {
    pub id: u64,
    pub seller: Address,
    pub reserve_price: i128,
    pub bidding_end_ts: u64,
    pub reveal_end_ts: u64,
    pub settled: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BidRecord {
    pub bidder: Address,
    pub commitment: BytesN<32>,
    pub deposit: i128,
    pub bid_amount: i128,
    pub status: BidStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuctionSummary {
    pub id: u64,
    pub seller: Address,
    pub reserve_price: i128,
    pub bidding_end_ts: u64,
    pub reveal_end_ts: u64,
    pub stage: AuctionStage,
    pub highest_bid: i128,
    pub total_bids: u32,
    pub settled: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuctionResult {
    pub auction_id: u64,
    pub winner: Option<Address>,
    pub winning_bid: i128,
    pub seller_proceeds: i128,
    pub fee: i128,
    pub forfeited: i128,
}
