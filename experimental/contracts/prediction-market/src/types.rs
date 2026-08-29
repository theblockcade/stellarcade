//! Shared data types for the binary prediction market contract.

use soroban_sdk::{contracttype, Address, String};

/// On-chain state of a YES/NO market.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Market {
    pub id: u64,
    pub creator: Address,
    pub title: String,
    pub expiry_ts: u64,
    /// CPMM YES-share reserve.
    pub yes_pool: u128,
    /// CPMM NO-share reserve.
    pub no_pool: u128,
    /// Collateral backing outstanding shares.
    pub collateral: u128,
    pub resolved: bool,
    /// Meaningful only when `resolved` is true.
    pub winning_is_yes: bool,
}

/// A trader's YES/NO share balances in one market.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Position {
    pub yes_shares: u128,
    pub no_shares: u128,
}
