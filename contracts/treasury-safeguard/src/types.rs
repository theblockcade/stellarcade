use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SafeguardConfig {
    pub admin: Address,
    pub threshold_limit: i128,
    pub cooldown_period: u64,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ThresholdBreachSummary {
    pub is_breached: bool,
    pub breach_count: u32,
    pub last_breach_timestamp: u64,
    pub threshold_value: i128,
    pub current_value: i128,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CooldownRelease {
    pub is_in_cooldown: bool,
    pub cooldown_end_timestamp: u64,
    pub remaining_seconds: u64,
    pub is_paused: bool,
}

#[contracttype]
pub enum DataKey {
    Config,
    BreachCount,
    LastBreachTime,
    CurrentValue,
    CooldownEnd,
}
