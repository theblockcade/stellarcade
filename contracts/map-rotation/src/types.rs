use soroban_sdk::{contracttype, Symbol, Vec};

/// Snapshot of the current active map cycle.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveMapCycleSnapshot {
    /// Current active map identifier.
    pub current_map: Symbol,
    /// Time when current cycle started.
    pub cycle_start_time: u32,
    /// Number of players currently active on this map.
    pub players_active: u32,
    /// Total number of maps in rotation.
    pub total_maps: u32,
}

/// Details about the next map rotation.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NextRotation {
    /// Next map to be rotated to.
    pub next_map: Symbol,
    /// Scheduled rotation time.
    pub rotation_time: u32,
    /// Time remaining until rotation.
    pub time_until_rotation: u32,
    /// Queue of upcoming maps.
    pub queued_maps: Vec<Symbol>,
}