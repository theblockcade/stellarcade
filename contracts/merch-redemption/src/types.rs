use soroban_sdk::{contracttype, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StockPressureLevel {
    None = 0,
    Low = 1,
    Medium = 2,
    High = 3,
}

/// Tracked aggregate for one merchandise claim window.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimWindowState {
    pub start_time: u64,
    pub end_time: u64,
    pub total_available: u32,
    pub claimed_count: u32,
}

/// Snapshot of claim-window details returned to consumers.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimWindowSnapshot {
    pub item_id: Symbol,
    /// True when a claim-window aggregate has been configured for `item_id`.
    pub configured: bool,
    /// True when the current ledger timestamp is within the configured window.
    pub is_active: bool,
    pub start_time: u64,
    pub end_time: u64,
    pub total_available: u32,
    pub claimed_count: u32,
    pub remaining_stock: u32,
}

/// Read-only stock pressure summary used by UI/API consumers.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StockPressure {
    pub item_id: Symbol,
    /// True when a claim-window aggregate has been configured for `item_id`.
    pub configured: bool,
    pub claim_window_open: bool,
    pub total_available: u32,
    pub claimed_count: u32,
    pub remaining_stock: u32,
    /// Claimed ratio in basis points (0-10000).
    pub pressure_bps: u32,
    pub pressure_level: StockPressureLevel,
}
