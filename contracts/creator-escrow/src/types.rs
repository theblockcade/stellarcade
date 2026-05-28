use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreatorEscrowConfig {
    pub creator: Address,
    pub payout_token: Address,
    pub beneficiary: Address,
    pub release_delay_ledgers: u32,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreatorEscrowTotals {
    pub total_locked: i128,
    pub total_released: i128,
    pub pending_entry_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreatorEscrowEntry {
    pub entry_id: u64,
    pub amount: i128,
    pub created_at_ledger: u32,
    pub releasable_at_ledger: u32,
    pub released: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreatorEscrowSummary {
    pub creator: Address,
    pub exists: bool,
    pub paused: bool,
    pub payout_token: Option<Address>,
    pub beneficiary: Option<Address>,
    pub release_delay_ledgers: u32,
    pub total_locked: i128,
    pub total_released: i128,
    pub releasable_now: i128,
    pub pending_entry_count: u32,
    pub next_entry_id: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreatorEscrowEntryView {
    pub creator: Address,
    pub entry_id: u64,
    pub exists: bool,
    pub paused: bool,
    pub amount: i128,
    pub created_at_ledger: u32,
    pub releasable_at_ledger: u32,
    pub released: bool,
    pub releasable_now: bool,
}
