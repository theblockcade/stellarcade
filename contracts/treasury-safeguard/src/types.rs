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

/// Safeguard limits summary returned by `get_safeguard_limits_summary`.
///
/// `utilization_bps = floor(current_value.min(threshold_limit) * 10_000 / threshold_limit)`
/// when `threshold_limit > 0 && current_value > 0`, otherwise 0. `is_at_limit`
/// is true when `threshold_limit > 0 && current_value >= threshold_limit`.
/// Missing or unconfigured states return `is_configured = false` with all zeros.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SafeguardLimitsSummary {
    pub is_configured: bool,
    pub threshold_limit: i128,
    pub cooldown_period: u64,
    pub breach_count: u32,
    pub current_value: i128,
    pub utilization_bps: u32,
    pub is_at_limit: bool,
    pub is_paused: bool,
}

/// Override-window view returned by `get_override_window_accessor`.
///
/// `override_available` is true when the safeguard is configured, not currently
/// in cooldown, and not paused — meaning an authorized caller may act without
/// waiting for a cooldown to expire.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OverrideWindowAccessor {
    pub is_configured: bool,
    pub is_in_cooldown: bool,
    pub cooldown_end_timestamp: u64,
    pub remaining_cooldown_secs: u64,
    pub override_available: bool,
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
