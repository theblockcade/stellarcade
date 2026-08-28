//! Shared data types for the Dutch auction contract.

use soroban_sdk::{contracttype, Address};

/// Read-only snapshot of an auction.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DutchAuctionSummary {
    pub id: u64,
    pub seller: Address,
    pub token_id: u64,
    pub start_price: i128,
    pub floor_price: i128,
    pub start_ts: u64,
    pub duration_sec: u64,
    pub settled: bool,
    pub cancelled: bool,
    /// Set once `buy` succeeds.
    pub buyer: Option<Address>,
}
