#![allow(dead_code)]

use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BonusCycle {
    pub cycle_id: u64,
    pub bonus_bps: u32,
    pub starts_at: u64,
    pub ends_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveBonusCycleSnapshot {
    pub has_active_cycle: bool,
    pub paused: bool,
    pub now: u64,
    pub cycle_id: u64,
    pub bonus_bps: u32,
    pub starts_at: u64,
    pub ends_at: u64,
}

/// Summary of the rotator's current operational state.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RotatorStatusSummary {
    pub is_configured: bool,
    pub is_paused: bool,
    pub active_cycle_id: u64,
    pub bonus_bps: u32,
    pub cycle_starts_at: u64,
    pub cycle_ends_at: u64,
}

/// Delay until the next cycle boundary, in seconds. Zero when no cycle is configured.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CycleDelay {
    pub seconds_until_end: u64,
    pub has_active_cycle: bool,
}
