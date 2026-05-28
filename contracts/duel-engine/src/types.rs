#![allow(dead_code)]

use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OpenDuelSummary {
    pub open_count: u32,
    pub oldest_open_duel_id: u64,
    pub newest_open_duel_id: u64,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ResolutionReadiness {
    pub duel_id: u64,
    pub exists: bool,
    pub is_open: bool,
    pub is_ready_to_resolve: bool,
}
