#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

pub mod types;
pub mod storage;

#[cfg(test)]
mod test;

use crate::types::{ThresholdBreachSummary, CooldownRelease, SafeguardConfig};
use crate::storage::{
    get_config, set_config, get_breach_count, set_breach_count,
    get_last_breach_time, set_last_breach_time, get_current_value,
    set_current_value, get_cooldown_end, set_cooldown_end
};

#[contract]
pub struct TreasurySafeguard;

#[contractimpl]
impl TreasurySafeguard {
    /// Initializes the safeguard with admin, threshold limit, and cooldown period.
    pub fn init(env: Env, admin: Address, threshold_limit: i128, cooldown_period: u64) {
        if get_config(&env).is_some() {
            panic!("Already initialized");
        }
        admin.require_auth();
        set_config(&env, &SafeguardConfig {
            admin,
            threshold_limit,
            cooldown_period,
            paused: false,
        });
    }

    /// Toggles the paused state of the safeguard. Admin only.
    pub fn set_paused(env: Env, admin: Address, paused: bool) {
        let mut config = get_config(&env).expect("Not initialized");
        admin.require_auth();
        assert!(admin == config.admin, "Unauthorized");

        config.paused = paused;
        set_config(&env, &config);
    }

    /// Returns a structured summary of the current threshold breach state.
    /// Handles unconfigured states by returning default values.
    pub fn get_threshold_breach_summary(env: Env) -> ThresholdBreachSummary {
        let config = get_config(&env);
        let threshold_value = config.clone().map(|c| c.threshold_limit).unwrap_or(0);
        let current_value = get_current_value(&env);
        let is_paused = config.map(|c| c.paused).unwrap_or(false);
        
        ThresholdBreachSummary {
            is_breached: current_value >= threshold_value && threshold_value > 0,
            breach_count: get_breach_count(&env),
            last_breach_timestamp: get_last_breach_time(&env),
            threshold_value,
            current_value,
            is_paused,
        }
    }

    /// Returns the current cooldown status.
    /// Handles empty/missing states by returning is_in_cooldown = false.
    pub fn get_cooldown_release(env: Env) -> CooldownRelease {
        let now = env.ledger().timestamp();
        let cooldown_end = get_cooldown_end(&env);
        let config = get_config(&env);
        let is_paused = config.map(|c| c.paused).unwrap_or(false);
        
        let is_in_cooldown = now < cooldown_end;
        let remaining_seconds = if is_in_cooldown {
            cooldown_end - now
        } else {
            0
        };

        CooldownRelease {
            is_in_cooldown,
            cooldown_end_timestamp: cooldown_end,
            remaining_seconds,
            is_paused,
        }
    }

    /// Administrative method to record activity and check for breaches.
    pub fn record_activity(env: Env, admin: Address, value: i128) {
        let config = get_config(&env).expect("Not initialized");
        assert!(!config.paused, "Safeguard is paused");
        admin.require_auth();
        assert!(admin == config.admin, "Unauthorized");

        let mut current_breach_count = get_breach_count(&env);
        let now = env.ledger().timestamp();

        if value >= config.threshold_limit {
            current_breach_count += 1;
            set_breach_count(&env, current_breach_count);
            set_last_breach_time(&env, now);
            set_cooldown_end(&env, now + config.cooldown_period);
        }

        set_current_value(&env, value);
    }

    /// Resets the breach state and clears cooldown.
    pub fn reset_safeguard(env: Env, admin: Address) {
        let config = get_config(&env).expect("Not initialized");
        assert!(!config.paused, "Safeguard is paused");
        admin.require_auth();
        assert!(admin == config.admin, "Unauthorized");

        set_breach_count(&env, 0);
        set_last_breach_time(&env, 0);
        set_current_value(&env, 0);
        set_cooldown_end(&env, 0);
    }
}
