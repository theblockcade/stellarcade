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
