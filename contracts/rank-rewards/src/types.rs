use soroban_sdk::contracttype;

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum BracketState {
    NotConfigured,
    Missing,
    Active,
    Paused,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum RolloverReadiness {
    /// The player has no rank-rewards record yet.
    NoRecord,
    /// The bracket the player was assigned to was deleted.
    MissingBracket,
    /// The cooldown since the last rollover hasn't elapsed.
    NotReady,
    /// Player is ready and the bracket is active — UI can show the action.
    Ready,
    /// Cooldown elapsed but the bracket is paused, so rollover is gated.
    BlockedByPause,
}

/// Storage-backed bracket definition. The aggregate `total_reward_owed` is
/// maintained on each `set_player_rank` call so the summary stays O(1).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BracketConfig {
    pub bracket_id: u32,
    pub min_rank: u32,
    pub max_rank: u32,
    pub reward_per_player: u128,
    pub rollover_cooldown_secs: u64,
    pub player_count: u32,
    pub total_reward_owed: u128,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerRecord {
    pub bracket_id: u32,
    pub rank: u32,
    pub last_rollover_at: u64,
}

/// Structured response for `bracket_reward_summary` (#774).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BracketRewardSummary {
    pub bracket_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub state: BracketState,
    pub min_rank: u32,
    pub max_rank: u32,
    pub reward_per_player: u128,
    pub player_count: u32,
    pub total_reward_owed: u128,
    /// `rollover_cooldown_secs` is surfaced here too so a single read
    /// covers both panels (summary + readiness).
    pub rollover_cooldown_secs: u64,
}

/// Structured response for `rollover_readiness_accessor` (#774).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RolloverReadinessInfo {
    pub configured: bool,
    pub player_found: bool,
    pub bracket_found: bool,
    pub bracket_id: u32,
    pub rank: u32,
    pub last_rollover_at: u64,
    /// Earliest ledger timestamp at which the next rollover is allowed.
    pub next_rollover_at: u64,
    /// `0` if the player is already ready or has no record / bracket.
    pub seconds_until_ready: u64,
    pub readiness: RolloverReadiness,
    pub bracket_paused: bool,
}
