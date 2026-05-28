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

/// Drip-pressure snapshot returned by `drip_pressure_summary`.
///
/// Zero-state: all numeric fields are zero and `is_configured` is false when
/// no stream has been configured.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DripPressureSummary {
    pub is_configured: bool,
    pub stream_id: u64,
    pub total_allocated: i128,
    pub total_withdrawn: i128,
    pub remaining: i128,
    pub pressure_bps: u32,
    pub paused: bool,
}

/// Pause-recovery view returned by `pause_recovery_accessor`.
///
/// Zero-state: all numeric fields are zero and `is_configured` is false when
/// no stream has been configured.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PauseRecoveryAccessor {
    pub is_configured: bool,
    pub stream_id: u64,
    pub paused: bool,
    pub unlock_time: u64,
    pub remaining: i128,
    pub recovery_ready: bool,
    pub blocked_reason_code: u32,
}
