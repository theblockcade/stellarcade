use soroban_sdk::contracttype;

/// Summary of bracket health metrics.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BracketHealthSummary {
    pub bracket_id: u32,
    /// True when the bracket_id exists.
    pub exists: bool,
    /// Number of players in this bracket.
    pub player_count: u32,
    /// Number of active games in this bracket.
    pub active_games: u32,
    /// Score threshold for promotion.
    pub promotion_threshold: u32,
}

/// Promotion cutoff details for a bracket.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCutoff {
    pub bracket_id: u32,
    /// True when the bracket_id exists.
    pub exists: bool,
    /// Minimum score required for promotion.
    pub cutoff_score: u32,
    /// Rank cutoff for promotion.
    pub cutoff_rank: u32,
    /// Next scheduled promotion time.
    pub next_promotion_time: u32,
}

/// Bracket data structure.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BracketData {
    pub player_count: u32,
    pub active_games: u32,
    pub promotion_threshold: u32,
    pub cutoff_score: u32,
    pub cutoff_rank: u32,
    pub next_promotion_time: u32,
}

/// Bracket health data.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BracketHealthData {
    pub player_count: u32,
    pub active_games: u32,
    pub promotion_threshold: u32,
}