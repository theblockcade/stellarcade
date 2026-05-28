use soroban_sdk::contracttype;

/// Lifecycle state of a checkpoint as surfaced by the summary read.
///
/// Distinct from `bool paused` so the summary view can communicate the four
/// states a frontend cares about in a single field.
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum CheckpointState {
    /// The contract has not been `init`'d yet — no admin recorded.
    NotConfigured,
    /// The contract is configured but no checkpoint exists at the requested
    /// id. Returned alongside zeroed thresholds.
    Missing,
    /// Checkpoint is configured and accepting drift recordings.
    Active,
    /// Checkpoint exists but is administratively paused; readers should
    /// hide restore-action prompts.
    Paused,
}

/// Restore-window state for the per-player accessor.
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum RestoreWindowState {
    /// The player has no checkpoint record.
    NoRecord,
    /// The checkpoint referenced by the player's record was deleted.
    MissingCheckpoint,
    /// The player has not drifted past the checkpoint — no restore needed.
    NotDrifted,
    /// The player has drifted but the restore window is still open.
    Open,
    /// The restore window has closed; the player must re-qualify from
    /// scratch.
    Closed,
    /// The checkpoint is paused; restore prompts should be hidden.
    Blocked,
}

/// Storage-backed checkpoint definition. Reused by the summary accessor and
/// the restore-window accessor so neither has to reconstruct counts from a
/// player scan.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CheckpointConfig {
    pub checkpoint_id: u32,
    /// The score / rank a player must be at to keep their checkpoint.
    pub min_score: u32,
    /// The restore deadline (in seconds) starts at `last_seen_at`.
    pub restore_window_secs: u64,
    /// Players whose `last_score` is at or above `min_score`.
    pub active_player_count: u32,
    /// Players whose `last_score` is below `min_score` and whose
    /// `last_seen_at + restore_window_secs > now` at the time of the last
    /// drift recording.
    pub drifted_player_count: u32,
    pub paused: bool,
}

/// Per-player record persisted in storage.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerRecord {
    pub checkpoint_id: u32,
    pub last_score: u32,
    pub last_seen_at: u64,
}

/// Structured response for `checkpoint_drift_summary` (#780). Zero-states
/// are explicit (`exists = false` + zeroed counts) so consumers can render
/// a placeholder before any drift recordings exist.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CheckpointDriftSummary {
    pub checkpoint_id: u32,
    /// `true` once the contract has been initialised.
    pub configured: bool,
    /// `true` once the checkpoint has been upserted at least once.
    pub exists: bool,
    pub state: CheckpointState,
    pub min_score: u32,
    pub restore_window_secs: u64,
    pub active_player_count: u32,
    pub drifted_player_count: u32,
    /// Total players currently associated with the checkpoint
    /// (`active_player_count + drifted_player_count`). Surfaced as a single
    /// field so the frontend doesn't have to add them itself.
    pub total_player_count: u32,
}

/// Structured response for `restore_window_accessor` (#780). All timing
/// fields are exact seconds; missing values are 0 paired with the relevant
/// `RestoreWindowState` so consumers can branch on the enum rather than
/// pattern-matching zero sentinels.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RestoreWindowInfo {
    pub configured: bool,
    pub player_found: bool,
    pub checkpoint_found: bool,
    pub checkpoint_id: u32,
    pub last_score: u32,
    pub last_seen_at: u64,
    /// The ledger timestamp at which the restore window closes. `0` when
    /// the state is `NoRecord` or `MissingCheckpoint`.
    pub restore_deadline: u64,
    pub seconds_remaining: u64,
    pub state: RestoreWindowState,
    pub checkpoint_paused: bool,
}
