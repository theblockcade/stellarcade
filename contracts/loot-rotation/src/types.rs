use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LootPool {
    pub pool_id: u64,
    pub item_count: u32,
    pub reward_weight: u32,
    pub starts_at: u64,
    pub ends_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActivePoolSnapshot {
    pub configured: bool,
    pub paused: bool,
    pub has_active_pool: bool,
    pub pool_id: u64,
    pub item_count: u32,
    pub reward_weight: u32,
    pub starts_at: u64,
    pub ends_at: u64,
    pub now: u64,
    pub seconds_until_rollover: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RolloverDelay {
    pub configured: bool,
    pub paused: bool,
    pub has_active_pool: bool,
    pub rollover_due: bool,
    pub now: u64,
    pub ends_at: u64,
    pub seconds_until_rollover: u64,
}

/// Aggregated rotation queue summary returned by `rotation_queue_summary`.
///
/// Zero-state: `has_active_pool = false` and zeroed numeric fields when no
/// pool has been configured. `paused` reflects the current pause state.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RotationQueueSummary {
    pub configured: bool,
    pub paused: bool,
    pub has_active_pool: bool,
    pub pool_id: u64,
    pub item_count: u32,
    pub reward_weight: u32,
    pub starts_at: u64,
    pub ends_at: u64,
    pub now: u64,
    pub seconds_until_rollover: u64,
    pub rollover_due: bool,
}

/// Transition gap returned by `transition_gap`.
///
/// Zero-state: `has_active_pool = false` and zeroed timing fields when no
/// pool is configured. `transition_due` is `true` once `ends_at` is reached.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransitionGap {
    pub configured: bool,
    pub paused: bool,
    pub has_active_pool: bool,
    pub transition_due: bool,
    pub pool_id: u64,
    pub ends_at: u64,
    pub now: u64,
    pub seconds_until_transition: u64,
}
