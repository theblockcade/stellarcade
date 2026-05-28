use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Gate {
    pub id: u64,
    pub capacity: u32,
    pub occupancy: u32,
    /// Ledger time at/after which the gate releases (admits players).
    pub release_time: u64,
    pub is_paused: bool,
}

/// Point-in-time status of a lobby gate.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GateStatusSnapshot {
    pub gate_exists: bool,
    pub capacity: u32,
    pub occupancy: u32,
    pub remaining_slots: u32,
    /// Released (release_time reached) and not paused.
    pub is_open: bool,
    pub is_paused: bool,
    pub is_full: bool,
}

/// Time remaining until a gate releases.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReleaseDelay {
    pub gate_exists: bool,
    pub release_time: u64,
    pub current_time: u64,
    /// Seconds until release (0 once released).
    pub seconds_until_release: u64,
    pub is_released: bool,
}
