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
