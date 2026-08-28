//! Shared data types for the royalty distributor contract.

use soroban_sdk::{contracttype, Address, Vec};

/// A recipient's share of a split, in basis points (1/100 of a percent).
/// All shares in a split must sum to exactly 10,000 (100%).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecipientShare {
    pub recipient: Address,
    pub share_bps: u32,
}

/// A configured royalty split: its fixed recipient/share table plus
/// running totals used to compute each recipient's claimable balance.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Split {
    pub admin: Address,
    pub recipients: Vec<RecipientShare>,
    /// Sum of every deposit ever made into this split.
    pub total_received: u128,
}
