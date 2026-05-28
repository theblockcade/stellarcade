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
