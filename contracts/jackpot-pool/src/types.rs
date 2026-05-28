use soroban_sdk::contracttype;

/// Aggregated summary of all contributions in the current round.
///
/// `top_contributor_share_bps` is the top contributor's share expressed in
/// basis points (1 bp = 0.01%). When the pool is empty this field is 0.
/// Arithmetic uses integer division; fractional basis points are truncated.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContributorSummary {
    /// Total tokens contributed to the pool in the current round.
    pub total_contributed: i128,
    /// Number of unique addresses that have contributed this round.
    pub contributor_count: u32,
    /// Share of the top contributor in basis points (0–10_000).
    /// `0` when the pool is empty.
    pub top_contributor_share_bps: u32,
}

/// Snapshot of whether the next draw is adequately funded.
///
/// `shortfall` is `max(0, minimum_target − current_funded)`.
/// `is_funded` is `true` when `current_funded >= minimum_target`.
/// Returns zeroed values when the pool has not been seeded.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FundingSnapshot {
    /// Minimum token amount required to trigger a draw.
    pub minimum_target: i128,
    /// Tokens currently held in the pool.
    pub current_funded: i128,
    /// Tokens still needed to reach `minimum_target`.
    pub shortfall: i128,
    /// `true` when `current_funded >= minimum_target`.
    pub is_funded: bool,
}
