use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Mission {
    pub id: u64,
    /// Check-ins counted within the current window.
    pub total_checkins: u64,
    /// Distinct participants within the current window.
    pub unique_participants: u32,
    pub window_start: u64,
    /// Length of a participation window in seconds; 0 disables resets.
    pub reset_interval: u64,
    pub is_active: bool,
}

/// Participation totals for the current window.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ParticipationSummary {
    pub mission_exists: bool,
    pub total_checkins: u64,
    pub unique_participants: u32,
}

/// The current reset window and time until it rolls over.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ResetWindow {
    pub mission_exists: bool,
    pub window_start: u64,
    pub reset_interval: u64,
    pub next_reset: u64,
    pub current_time: u64,
    /// Seconds until the window resets (0 when elapsed or resets disabled).
    pub seconds_until_reset: u64,
    /// True once the current window has elapsed and the next check-in resets it.
    pub window_elapsed: bool,
}

/// Check-in rate for the current window expressed in whole check-ins per 1000
/// seconds, plus a unique-participant ratio in basis points.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CheckInFrequencySnapshot {
    pub mission_exists: bool,
    pub total_checkins: u64,
    pub unique_participants: u32,
    pub window_duration_secs: u64,
    /// Floor(total_checkins * 1000 / window_duration_secs); 0 when window is
    /// zero-length or the mission does not exist.
    pub checkins_per_1k_secs: u64,
    /// unique_participants * 10_000 / total_checkins (bps), or 0 when no
    /// check-ins have been recorded.
    pub unique_ratio_bps: u32,
}

/// Whether a participant's streak would be lost if they do not check in
/// before the current window expires.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreakDecay {
    pub mission_exists: bool,
    pub participant_active_this_window: bool,
    pub window_elapsed: bool,
    /// True when the window has elapsed and the participant has NOT checked
    /// in during it — their streak resets on the next check-in.
    pub streak_decayed: bool,
    pub seconds_until_decay: u64,
}
