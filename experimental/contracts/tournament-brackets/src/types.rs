//! Shared data types for the tournament bracket contract.

use soroban_sdk::{contracttype, Address, Vec};

/// A single matchup: two seeded players (or, for later rounds, `None` until
/// both feeder matches resolve) and the recorded winner, if any.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchupPair {
    pub round_idx: u32,
    pub match_idx: u32,
    pub player_a: Option<Address>,
    pub player_b: Option<Address>,
    pub winner: Option<Address>,
}

/// Read-only snapshot of the full bracket tree, round by round.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BracketTreeSummary {
    pub bracket_id: u64,
    pub admin: Address,
    pub player_count: u32,
    pub round_count: u32,
    pub rounds: Vec<Vec<MatchupPair>>,
    pub champion: Option<Address>,
    pub is_finalized: bool,
}
