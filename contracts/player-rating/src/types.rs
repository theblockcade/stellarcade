use soroban_sdk::{contracttype, Address, Vec};

/// Summary of player rating volatility.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VolatilitySummary {
    pub player: Address,
    /// True when the player has ratings.
    pub exists: bool,
    /// Current volatility score.
    pub current_volatility: u32,
    /// Trend in volatility over recent games.
    pub volatility_trend: i32,
    /// Total games played by this player.
    pub games_played: u32,
}

/// Snapshot of recent rating adjustments.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecentAdjustmentSnapshot {
    pub player: Address,
    /// True when the player has ratings.
    pub exists: bool,
    /// Last rating adjustment amount.
    pub last_adjustment: i32,
    /// Number of recent adjustments.
    pub adjustment_count: u32,
    /// List of recent game IDs affecting rating.
    pub recent_games: Vec<Symbol>,
}