#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env};

#[test]
fn test_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(TreasurySafeguard, ());
    let client = TreasurySafeguardClient::new(&env, &contract_id);

    client.init(&admin, &1000, &3600);

    let summary = client.get_threshold_breach_summary();
    assert_eq!(summary.threshold_value, 1000);
    assert_eq!(summary.is_breached, false);
}

#[test]
fn test_threshold_breach_and_cooldown() {
    let env = Env::default();
    env.ledger().set_timestamp(1000);
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasurySafeguard, ());
    let client = TreasurySafeguardClient::new(&env, &contract_id);

    let threshold = 1000;
    let cooldown = 3600;
    client.init(&admin, &threshold, &cooldown);

    // Record activity below threshold
    client.record_activity(&admin, &500);
    let summary = client.get_threshold_breach_summary();
    assert_eq!(summary.is_breached, false);
    assert_eq!(summary.current_value, 500);

    let cooldown_info = client.get_cooldown_release();
    assert_eq!(cooldown_info.is_in_cooldown, false);

    // Record activity at/above threshold
    client.record_activity(&admin, &1200);
    let summary = client.get_threshold_breach_summary();
    assert_eq!(summary.is_breached, true);
    assert_eq!(summary.breach_count, 1);
    assert!(summary.last_breach_timestamp > 0);

    let cooldown_info = client.get_cooldown_release();
    assert_eq!(cooldown_info.is_in_cooldown, true);
    assert!(cooldown_info.remaining_seconds > 0);
}

#[test]
fn test_missing_state_behavior() {
    let env = Env::default();
    let contract_id = env.register(TreasurySafeguard, ());
    let client = TreasurySafeguardClient::new(&env, &contract_id);

    // Summary before init
    let summary = client.get_threshold_breach_summary();
    assert_eq!(summary.threshold_value, 0);
    assert_eq!(summary.is_breached, false);

    // Cooldown before init
    let cooldown_info = client.get_cooldown_release();
    assert_eq!(cooldown_info.is_in_cooldown, false);
}

#[test]
fn test_reset_functionality() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasurySafeguard, ());
    let client = TreasurySafeguardClient::new(&env, &contract_id);

    client.init(&admin, &1000, &3600);
    client.record_activity(&admin, &1000);

    assert_eq!(client.get_threshold_breach_summary().is_breached, true);

    client.reset_safeguard(&admin);
    let summary = client.get_threshold_breach_summary();
    assert_eq!(summary.is_breached, false);
    assert_eq!(summary.breach_count, 0);
    assert_eq!(client.get_cooldown_release().is_in_cooldown, false);
}

#[test]
fn test_pause_behavior() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasurySafeguard, ());
    let client = TreasurySafeguardClient::new(&env, &contract_id);

    client.init(&admin, &1000, &3600);

    client.set_paused(&admin, &true);
    assert_eq!(client.get_threshold_breach_summary().is_paused, true);
    assert_eq!(client.get_cooldown_release().is_paused, true);

    // Recording activity while paused should fail
    let res = client.try_record_activity(&admin, &500);
    assert!(res.is_err());

    client.set_paused(&admin, &false);
    assert_eq!(client.get_threshold_breach_summary().is_paused, false);

    let res = client.try_record_activity(&admin, &500);
    assert!(res.is_ok());
}

#[test]
fn test_safeguard_limits_summary_success_path() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(TreasurySafeguard, ());
    let client = TreasurySafeguardClient::new(&env, &contract_id);

    client.init(&admin, &1000, &3600);
    client.record_activity(&admin, &600);

    let summary = client.get_safeguard_limits_summary();
    assert!(summary.is_configured);
    assert_eq!(summary.threshold_limit, 1000);
    assert_eq!(summary.cooldown_period, 3600);
    assert_eq!(summary.current_value, 600);
    // 600/1000 → 6_000 bps
    assert_eq!(summary.utilization_bps, 6_000);
    assert!(!summary.is_at_limit);
    assert!(!summary.is_paused);
}

#[test]
fn test_safeguard_limits_summary_missing_is_zero_state() {
    let env = Env::default();
    let contract_id = env.register(TreasurySafeguard, ());
    let client = TreasurySafeguardClient::new(&env, &contract_id);

    let summary = client.get_safeguard_limits_summary();
    assert!(!summary.is_configured);
    assert_eq!(summary.threshold_limit, 0);
    assert_eq!(summary.utilization_bps, 0);
    assert!(!summary.is_at_limit);
}

#[test]
fn test_override_window_accessor_available_when_no_breach() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1000);

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasurySafeguard, ());
    let client = TreasurySafeguardClient::new(&env, &contract_id);

    client.init(&admin, &1000, &3600);

    let accessor = client.get_override_window_accessor();
    assert!(accessor.is_configured);
    assert!(!accessor.is_in_cooldown);
    assert_eq!(accessor.remaining_cooldown_secs, 0);
    assert!(accessor.override_available);
    assert!(!accessor.is_paused);
}

#[test]
fn test_override_window_accessor_blocked_by_cooldown() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1000);

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasurySafeguard, ());
    let client = TreasurySafeguardClient::new(&env, &contract_id);

    client.init(&admin, &1000, &3600);
    // Breach: value >= threshold → triggers cooldown until 1000 + 3600 = 4600
    client.record_activity(&admin, &1000);

    let accessor = client.get_override_window_accessor();
    assert!(accessor.is_in_cooldown);
    assert_eq!(accessor.cooldown_end_timestamp, 4600);
    assert!(accessor.remaining_cooldown_secs > 0);
    assert!(!accessor.override_available);
}
