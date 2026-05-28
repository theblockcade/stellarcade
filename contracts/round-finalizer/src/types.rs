#![allow(dead_code)]

use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Eq, PartialEq)]
pub enum RoundFinalizerStatus {
    Unconfigured = 0,
    Active = 1,
    Paused = 2,
}

#[contracttype]
#[derive(Clone)]
pub struct RoundFinalizerConfig {
    pub admin: Address,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct RoundRecord {
    pub round_id: u64,
    pub unresolved_ops: u32,
    pub has_checkpoint: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct UnresolvedRoundSummary {
    pub status: RoundFinalizerStatus,
    pub total_rounds: u32,
    pub unresolved_rounds: u32,
    pub unresolved_ops: u32,
    pub next_unresolved_round_id: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct FinalizeReadiness {
    pub status: RoundFinalizerStatus,
    pub round_id: u64,
    pub is_ready: bool,
    pub unresolved_ops: u32,
    pub missing_checkpoint: bool,
}

/// Aggregate active-round read model for dashboard consumers.
///
/// A round is considered active while it has unresolved operations or is
/// missing its finalization checkpoint. Empty and unconfigured contracts return
/// zero counts with a non-active status.
#[contracttype]
#[derive(Clone)]
pub struct ActiveRoundSummary {
    pub status: RoundFinalizerStatus,
    pub total_rounds: u32,
    pub active_rounds: u32,
    pub ready_rounds: u32,
    pub blocked_rounds: u32,
    pub unresolved_ops: u32,
    pub next_active_round_id: u64,
}

/// Finalization pressure read model.
///
/// `pressure_bps` is floored basis-point math:
/// `blocked_rounds * 10_000 / total_rounds`. Empty, missing, and unconfigured
/// states return `pressure_bps = 0`.
#[contracttype]
#[derive(Clone)]
pub struct FinalizationPressure {
    pub status: RoundFinalizerStatus,
    pub total_rounds: u32,
    pub blocked_rounds: u32,
    pub unresolved_ops: u32,
    pub missing_checkpoints: u32,
    pub pressure_bps: u32,
    pub finalization_paused: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    RoundIds,
    Round(u64),
}
