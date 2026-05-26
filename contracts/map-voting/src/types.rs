use soroban_sdk::contracttype;

/// Snapshot of ballot participation for a voting round.
///
/// Returned by `ballot_participation_snapshot`. When the round has not been
/// configured, `exists` is `false` and all numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BallotParticipationSnapshot {
    pub round_id: u32,
    /// `true` when the round_id exists in storage.
    pub exists: bool,
    /// Total number of eligible voters for this round.
    pub eligible_voters: u32,
    /// Number of votes cast so far.
    pub votes_cast: u32,
    /// Participation rate in basis points (votes_cast * 10_000 / eligible_voters).
    /// Zero when `eligible_voters` is zero.
    pub participation_bps: u32,
    /// Whether the voting round is currently active.
    pub round_active: bool,
}

/// Tiebreak-window details for a voting round.
///
/// Returned by `tiebreak_window`. When the round has not been configured,
/// `exists` is `false` and timing fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TiebreakWindow {
    pub round_id: u32,
    /// `true` when the round_id exists in storage.
    pub exists: bool,
    /// Ledger sequence at which the tiebreak window opens.
    pub window_start: u32,
    /// Ledger sequence at which the tiebreak window closes.
    pub window_end: u32,
    /// Whether a tiebreak is currently required.
    pub tiebreak_required: bool,
    /// Whether the tiebreak window is currently open (based on current ledger).
    pub window_open: bool,
}

/// Persistent voting-round record.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VotingRoundRecord {
    pub eligible_voters: u32,
    pub votes_cast: u32,
    pub round_active: bool,
    pub tiebreak_required: bool,
    pub tiebreak_window_start: u32,
    pub tiebreak_window_end: u32,
}
