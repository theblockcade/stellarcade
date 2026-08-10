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

/// Entry status summary for a lobby gate: occupancy, capacity, and whether
/// entry is currently allowed.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EntryStatusSummary {
    pub gate_exists: bool,
    pub occupancy: u32,
    pub capacity: u32,
    pub remaining_slots: u32,
    pub is_open: bool,
    pub is_paused: bool,
    /// `true` only when the gate exists, is not paused, has been released, and
    /// has remaining capacity.
    pub entry_allowed: bool,
}

/// How long until a gate becomes unlocked (released AND not paused).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UnlockDelay {
    pub gate_exists: bool,
    /// `true` when the gate is both released and not paused.
    pub is_unlocked: bool,
    pub release_time: u64,
    pub current_time: u64,
    /// Seconds until the gate is fully unlocked (0 if already unlocked).
    pub seconds_until_unlock: u64,
}
