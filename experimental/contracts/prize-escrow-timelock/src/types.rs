//! Shared data types for the prize escrow timelock contract.

use soroban_sdk::{contracttype, Address, Symbol};

/// Lifecycle of a queued payout.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PayoutStatus {
    /// Timelock running; no dispute raised.
    Pending,
    /// An arbiter froze the payout during the challenge window.
    Frozen,
    /// Claimed by the winner after the timelock expired cleanly.
    Claimed,
    /// Resolved by an arbiter as fraudulent: funds redirected to the pool.
    Redirected,
}

/// A single timelocked tournament payout.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QueuedPayout {
    pub payout_id: u64,
    pub tournament_contract: Address,
    pub winner: Address,
    pub amount: u128,
    /// Ledger timestamp the payout was queued at.
    pub queued_at: u64,
    /// Ledger timestamp the timelock expires at (`queued_at + delay_sec`).
    pub unlock_at: u64,
    pub status: PayoutStatus,
    /// Symbol reason supplied by the arbiter when freezing, if any.
    pub freeze_reason: Option<Symbol>,
}

/// Read-only external summary of a queued payout.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PayoutSummary {
    pub payout_id: u64,
    pub tournament_contract: Address,
    pub winner: Address,
    pub amount: u128,
    pub queued_at: u64,
    pub unlock_at: u64,
    pub status: PayoutStatus,
    pub freeze_reason: Option<Symbol>,
}
