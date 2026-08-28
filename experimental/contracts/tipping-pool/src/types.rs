//! Shared data types for the tipping pool contract.

use soroban_sdk::{contracttype, Address, Symbol};

/// A single instruction in a batch tip: one creator, their tip amount, and
/// an attached memo.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TipInstruction {
    pub creator: Address,
    pub amount: i128,
    pub memo: Symbol,
}

/// A recorded tip, kept for the creator's recent-tips accessor.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TipRecord {
    pub tipper: Address,
    /// Amount credited to the creator's balance, after the platform fee.
    pub net_amount: i128,
    pub memo: Symbol,
    pub timestamp: u64,
}
