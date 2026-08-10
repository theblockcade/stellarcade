#![allow(dead_code)]

use soroban_sdk::contracttype;

/// Per-member payout record within a squad reward round.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MemberPayout {
    pub member_index: u32,
    pub amount: i128,
    pub claimed: bool,
}

/// Aggregated payout coverage summary for the squad.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TeamPayoutCoverage {
    pub total_members: u32,
    pub claimed_count: u32,
    pub unclaimed_count: u32,
    pub total_amount: i128,
    pub claimed_amount: i128,
}

/// Whether the squad is ready to claim rewards.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimReadiness {
    pub is_ready: bool,
    pub members_registered: u32,
    pub pool_funded: bool,
    pub total_pool: i128,
}
