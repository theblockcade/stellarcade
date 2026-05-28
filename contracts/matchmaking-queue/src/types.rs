use soroban_sdk::{contracttype, Symbol};

/// Coarse wait-time band for frontend display.
///
/// Fallback to `Unknown` when the queue has no history (no matches ever
/// created for this queue id). Clients must treat all bands as conservative
/// upper-bound estimates, not precise ETAs.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum WaitBand {
    /// Two or more players are waiting; a match can form immediately.
    Immediate,
    /// Exactly one player is waiting; one more arrival needed.
    Short,
    /// Queue is empty but has prior match history; more arrivals expected.
    Long,
    /// Queue is empty with no match history; estimate is unreliable.
    Unknown,
}

/// Read-only health snapshot for a single matchmaking queue.
///
/// `active_buckets` counts distinct criteria groups that currently hold
/// waiting players. With one criteria hash per queue this is 1 when players
/// are present and 0 when the queue is empty.
/// `matches_total` is the cumulative count of all matches ever formed from
/// this queue and serves as a lightweight throughput indicator.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QueueHealthSnapshot {
    pub queue_id: Symbol,
    /// Number of players currently waiting in this queue.
    pub queue_size: u32,
    /// Number of active criteria buckets (0 or 1 in the current design).
    pub active_buckets: u32,
    /// Total matches ever created from this queue.
    pub matches_total: u64,
}

/// Estimated wait-time band for a matchmaking queue.
///
/// When `has_history` is `false` the band is `WaitBand::Unknown` and
/// frontends should display a conservative fallback rather than a wait range.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WaitBandEstimate {
    pub queue_id: Symbol,
    /// Current queue size used to derive the band.
    pub queue_size: u32,
    /// Coarse wait-time category.
    pub wait_band: WaitBand,
    /// `false` when no matches have been created from this queue yet.
    pub has_history: bool,
}
