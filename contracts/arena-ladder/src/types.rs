use soroban_sdk::contracttype;

/// Bracket pressure snapshot for an arena ladder bracket.
///
/// Returned by `bracket_pressure_snapshot`. When no bracket has been
/// configured, `exists` is `false` and all numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BracketPressureSnapshot {
    pub bracket_id: u32,
    /// `true` when the bracket_id exists in storage.
    pub exists: bool,
    /// Current number of active players in the bracket.
    pub players_in_bracket: u32,
    /// Player count at or below which eliminations begin.
    pub elimination_threshold: u32,
    /// Aggregate competitive pressure score (higher = more contested).
    pub pressure_score: u32,
    /// `true` when players_in_bracket <= elimination_threshold.
    pub is_critical: bool,
}

/// Promotion window details for an arena ladder bracket.
///
/// Returned by `promotion_window`. When no bracket has been configured,
/// `exists` is `false` and numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionWindow {
    pub bracket_id: u32,
    /// `true` when the bracket_id exists in storage.
    pub exists: bool,
    /// Ledger sequence at which the promotion window opened.
    pub window_open_ledger: u32,
    /// Ledger sequence at which the promotion window closes.
    pub window_close_ledger: u32,
    /// Minimum rank a player must hold to be eligible for promotion.
    pub min_rank_for_promotion: u32,
    /// `true` when the promotion window is currently accepting candidates.
    pub window_active: bool,
}

/// Persistent bracket record written by admin mutations.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BracketRecord {
    pub players_in_bracket: u32,
    pub elimination_threshold: u32,
    pub pressure_score: u32,
    pub window_open_ledger: u32,
    pub window_close_ledger: u32,
    pub min_rank_for_promotion: u32,
    pub window_active: bool,
}
