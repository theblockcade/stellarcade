use soroban_sdk::{contracttype, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InviterAccount {
    pub total_earned: i128,
    pub total_claimed: i128,
    pub pending_rewards: i128,
    pub active_referees: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InviterEarningsSummary {
    pub exists: bool,
    pub total_earned: i128,
    pub total_claimed: i128,
    pub pending_rewards: i128,
    pub active_referees: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimReadiness {
    pub configured: bool,
    pub exists: bool,
    pub ready: bool,
    pub min_claim_amount: i128,
    pub claimable_amount: i128,
    pub blocker: Option<String>,
}
