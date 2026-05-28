use soroban_sdk::contracttype;

/// Snapshot taken at the moment a season transitions to the next.
///
/// Returned by `season_transition_snapshot`. When no season has been
/// configured yet, `exists` is `false` and all numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeasonTransitionSnapshot {
    pub season_id: u32,
    /// `true` when the season_id exists in storage.
    pub exists: bool,
    /// Ledger sequence at which the season ended / transitioned.
    pub ended_at_ledger: u32,
    /// Total number of players who participated in this season.
    pub total_participants: u32,
    /// Score of the top-ranked player at close.
    pub top_score: u32,
    /// Whether the season was paused before it could complete normally.
    pub was_paused: bool,
}

/// Demotion cutoff details for a ladder season.
///
/// Returned by `demotion_cutoff`. When the season or cutoff has not been
/// configured, `exists` is `false` and numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DemotionCutoff {
    pub season_id: u32,
    /// `true` when the season_id exists in storage.
    pub exists: bool,
    /// Minimum score a player must hold to avoid demotion.
    pub cutoff_score: u32,
    /// Rank boundary below which players are demoted.
    pub cutoff_rank: u32,
    /// Ledger sequence at which the demotion window closes.
    pub demotion_window_end: u32,
    /// Whether the demotion window is currently active.
    pub window_active: bool,
}

/// Persistent season record written by admin mutations.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeasonRecord {
    pub total_participants: u32,
    pub top_score: u32,
    pub ended_at_ledger: u32,
    pub was_paused: bool,
    pub cutoff_score: u32,
    pub cutoff_rank: u32,
    pub demotion_window_end: u32,
    pub demotion_window_active: bool,
}
