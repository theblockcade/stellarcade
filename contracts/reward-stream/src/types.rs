#![allow(dead_code)]

use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamData {
    pub stream_id: u64,
    pub total_allocated: i128,
    pub total_withdrawn: i128,
    pub unlock_time: u64,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamHealthSummary {
    pub is_configured: bool,
    pub stream_id: u64,
    pub total_allocated: i128,
    pub total_withdrawn: i128,
    pub remaining: i128,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WithdrawalReadiness {
    pub stream_id: u64,
    pub is_ready: bool,
    pub claimable_now: i128,
    pub blocked_reason_code: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DepletionBand {
    NotConfigured,
    Paused,
    Stable,
    Watch,
    Critical,
    Depleted,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamPressureSnapshot {
    pub is_configured: bool,
    pub stream_id: u64,
    pub total_allocated: i128,
    pub total_withdrawn: i128,
    pub remaining: i128,
    pub pressure_bps: u32,
    pub depletion_band: DepletionBand,
    pub paused: bool,
}
