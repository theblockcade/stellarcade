use soroban_sdk::contracttype;

/// Progress snapshot for a mission pass.
///
/// Returned by `pass_progress_snapshot`. When no pass has been configured,
/// `exists` is `false` and all numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PassProgressSnapshot {
    pub pass_id: u32,
    /// `true` when the pass_id exists in storage.
    pub exists: bool,
    /// Total number of missions in this pass.
    pub total_missions: u32,
    /// Number of missions the holder has completed.
    pub completed_missions: u32,
    /// Completion percentage (0–100), rounded down.
    pub completion_pct: u32,
    /// `true` when all missions are completed.
    pub is_complete: bool,
}

/// Unlock gap details for a mission pass.
///
/// Returned by `unlock_gap`. When no pass has been configured,
/// `exists` is `false` and numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UnlockGap {
    pub pass_id: u32,
    /// `true` when the pass_id exists in storage.
    pub exists: bool,
    /// Number of missions still needed to reach the next unlock.
    pub missions_to_next_unlock: u32,
    /// Cumulative missions required to trigger the next unlock tier.
    pub next_unlock_threshold: u32,
    /// Current completed mission count.
    pub current_progress: u32,
    /// `true` when the next unlock has not yet been reached.
    pub locked: bool,
}

/// Persistent pass record written by admin mutations.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PassRecord {
    pub total_missions: u32,
    pub completed_missions: u32,
    pub next_unlock_threshold: u32,
}
