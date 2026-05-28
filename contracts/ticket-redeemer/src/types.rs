use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TicketStatus {
    Pending = 0,
    Redeemed = 1,
    Expired = 2,
    Cancelled = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RedeemerConfig {
    pub admin: Address,
    pub token: Address,
    pub queue_capacity: u32,
    pub scan_window_size: u32,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QueueEntry {
    pub ticket_id: u64,
    pub owner: Address,
    pub status: TicketStatus,
    pub submitted_at: u32,
    pub redeemed_at: Option<u32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScanWindow {
    pub start_ledger: u32,
    pub end_ledger: u32,
    pub entries_scanned: u32,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QueueSnapshot {
    pub total_entries: u64,
    pub pending_count: u64,
    pub redeemed_count: u64,
    pub expired_count: u64,
    pub has_scan_window: bool,
    pub scan_window: ScanWindow,
    pub is_paused: bool,
    pub config_initialized: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QueueEntryView {
    pub exists: bool,
    pub ticket_id: Option<u64>,
    pub owner: Option<Address>,
    pub status: TicketStatus,
    pub submitted_at: Option<u32>,
    pub redeemed_at: Option<u32>,
}
