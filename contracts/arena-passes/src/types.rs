#![allow(dead_code)]

use soroban_sdk::contracttype;

/// Per-holder pass record.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PassHolder {
    pub holder_index: u32,
    pub uses_remaining: u32,
    pub issued_at: u64,
    pub expires_at: u64,
}

/// Snapshot of a holder's usage state.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HolderUsageSnapshot {
    pub total_holders: u32,
    pub active_holders: u32,
    pub expired_holders: u32,
    pub total_uses_remaining: u32,
}

/// How long until the renewal window opens for a holder (seconds).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RenewalWindow {
    pub holder_index: u32,
    pub is_found: bool,
    pub in_renewal_window: bool,
    pub seconds_until_expiry: u64,
}
