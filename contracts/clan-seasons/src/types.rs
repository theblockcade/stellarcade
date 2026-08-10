use soroban_sdk::contracttype;

/// Carryover snapshot taken at the end of a clan season.
///
/// Returned by `season_carryover_snapshot`. When no season has been
/// configured, `exists` is `false` and all numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeasonCarryoverSnapshot {
    pub season_id: u32,
    /// `true` when the season_id exists in storage.
    pub exists: bool,
    /// Experience points carried over into the next season.
    pub carryover_xp: u32,
    /// Rank carried over into the next season.
    pub carryover_rank: u32,
    /// Ledger sequence at which the season ended.
    pub season_end_ledger: u32,
    /// `true` when the roster was locked at the time of the snapshot.
    pub was_locked: bool,
}

/// Roster-lock state for a clan season.
///
/// Returned by `roster_lock`. When no season has been configured,
/// `exists` is `false` and numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RosterLock {
    pub season_id: u32,
    /// `true` when the season_id exists in storage.
    pub exists: bool,
    /// Ledger sequence at which the roster lock was applied.
    pub lock_ledger: u32,
    /// `true` when the roster is currently locked.
    pub is_locked: bool,
    /// Number of clan members locked into this season.
    pub locked_member_count: u32,
    /// Reason code for the lock (0 = not locked, 1 = season-end, 2 = admin).
    pub lock_reason_code: u32,
}

/// Participation statistics for a clan season.
///
/// Returned by `participation_summary`. When the season is unknown,
/// `exists` is `false` and all numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ParticipationSummary {
    pub season_id: u32,
    /// `true` when the season_id exists in storage.
    pub exists: bool,
    /// Number of clan members locked into this season.
    pub locked_member_count: u32,
    /// `true` when the roster was locked at some point during the season.
    pub was_locked: bool,
    /// Experience points carried over at season end.
    pub carryover_xp: u32,
    /// Rank carried over at season end.
    pub carryover_rank: u32,
}

/// Ledger gap between two consecutive clan seasons.
///
/// Returned by `transition_gap`. When either season is missing,
/// `gap_ledgers` is 0 and the corresponding `*_exists` flag is `false`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransitionGap {
    pub from_season_id: u32,
    pub to_season_id: u32,
    pub from_exists: bool,
    pub to_exists: bool,
    /// `season_end_ledger` of the `from` season.
    pub from_end_ledger: u32,
    /// `season_end_ledger` of the `to` season used as a proxy for its start
    /// ledger; 0 when the season is missing.
    pub to_start_ledger: u32,
    /// Saturating difference between `from_end_ledger` and `to_start_ledger`;
    /// 0 when either season is missing or the result would be negative.
    pub gap_ledgers: u32,
}

/// Persistent season record written by admin mutations.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeasonRecord {
    pub carryover_xp: u32,
    pub carryover_rank: u32,
    pub season_end_ledger: u32,
    pub was_locked: bool,
    pub lock_ledger: u32,
    pub is_locked: bool,
    pub locked_member_count: u32,
    pub lock_reason_code: u32,
}
