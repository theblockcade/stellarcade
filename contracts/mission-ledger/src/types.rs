use soroban_sdk::{contracttype, Address};

/// Lifecycle state of a mission. Mirrors the runtime states the frontend
/// renders on the dashboard (#681).
#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum MissionStatus {
    /// Mission has not been registered with the ledger yet.
    NotConfigured,
    /// Mission is registered and accepting progress.
    Active,
    /// Mission has been paused by the operator (registered but blocked).
    Paused,
    /// Mission was completed and the reward window has opened.
    Completed,
    /// Mission expired before completion; rewards are no longer claimable.
    Expired,
}

/// Why a player is or isn't ready to claim a mission reward (#679).
///
/// The frontend `CautionStatePanel` (#682) maps each reason onto a
/// human-readable explanation, so the values are stable and explicit.
#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum ClaimReadinessReason {
    /// Mission record does not exist for the queried id.
    MissionUnknown,
    /// Ledger has not been initialised yet — operators have not configured anything.
    LedgerNotConfigured,
    /// Mission is paused; the player must wait until it resumes.
    MissionPaused,
    /// Player has not registered progress against this mission.
    PlayerNotEnrolled,
    /// Player completed the required progress but has not yet claimed.
    Ready,
    /// Player has already claimed the reward.
    AlreadyClaimed,
    /// Mission expired before this player completed it.
    MissionExpired,
    /// Player progress has not reached the completion threshold.
    ProgressIncomplete,
}

/// On-chain record of a mission. Operators register one of these per mission;
/// players register progress against it.
#[contracttype]
#[derive(Clone, Debug)]
pub struct MissionRecord {
    pub mission_id: u64,
    pub operator: Address,
    pub completion_threshold: u32,
    pub reward_amount: i128,
    pub reward_token: Address,
    pub expires_at: u64,
    pub paused: bool,
    pub completed_count: u32,
    pub total_claimed: i128,
}

/// Read-only snapshot of mission state intended for the dashboard / SDK.
///
/// Returned by `mission_snapshot(mission_id)`. `exists=false` collapses every
/// other field to its zero value so consumers can render a "not configured"
/// state without a separate lookup.
#[contracttype]
#[derive(Clone, Debug)]
pub struct MissionSnapshot {
    pub mission_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub status: MissionStatus,
    pub completion_threshold: u32,
    pub completed_count: u32,
    pub reward_amount: i128,
    pub total_claimed: i128,
    pub expires_at: u64,
    pub now: u64,
}

/// Result of a `reward_claim_ready(mission_id, player)` query.
///
/// `ready` is the single boolean the UI gates the claim button on; `reason`
/// stays informative even when ready=true so observability tooling can log
/// which path was taken.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ClaimReadiness {
    pub mission_id: u64,
    pub ready: bool,
    pub reason: ClaimReadinessReason,
    pub progress: u32,
    pub threshold: u32,
}
