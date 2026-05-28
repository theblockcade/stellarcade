use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CooldownPolicy {
    pub cooldown_seconds: u64,
    pub threshold_amount: i128,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WalletClaimRecord {
    pub claim_id: u64,
    pub wallet: Address,
    pub amount: i128,
    pub available_after: u64,
    pub settled: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimPressureSnapshot {
    pub wallet: Address,
    pub configured: bool,
    pub policy_exists: bool,
    pub pending_claims: u32,
    pub matured_claims: u32,
    pub settled_claims: u32,
    pub pending_amount: i128,
    pub total_claims: u32,
    pub cooldown_seconds: u64,
    pub threshold_amount: i128,
    pub paused: bool,
    pub now: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CooldownThresholdAccessor {
    pub wallet: Address,
    pub configured: bool,
    pub policy_exists: bool,
    pub paused: bool,
    pub cooldown_seconds: u64,
    pub threshold_amount: i128,
    pub next_available_at: u64,
    pub seconds_until_next_window: u64,
    pub currently_blocked: bool,
    pub now: u64,
}
