#![allow(dead_code)]

use soroban_sdk::contracttype;

/// A single entry in the bridge queue.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BridgeEntry {
    pub entry_id: u64,
    pub amount: i128,
    pub settled: bool,
    pub queued_at: u64,
    pub settle_after: u64,
}

/// Aggregate summary of the bridge queue state.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BridgeQueueSummary {
    pub total_entries: u32,
    pub pending_count: u32,
    pub settled_count: u32,
    pub total_pending_amount: i128,
}

/// Gap between now and the next expected settlement, in seconds.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SettlementGap {
    pub has_pending: bool,
    pub seconds_until_next_settlement: u64,
    pub next_entry_id: u64,
}
