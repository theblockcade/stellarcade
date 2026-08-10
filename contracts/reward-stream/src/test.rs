extern crate std;

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{DepletionBand, RewardStream, RewardStreamClient};

#[test]
fn stream_health_and_readiness_success_path() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(RewardStream, ());
    let client = RewardStreamClient::new(&env, &id);
    env.mock_all_auths();

    client.init(&admin);
    client.configure_stream(&admin, &12, &1_000, &250, &100, &false);
    let summary = client.stream_health_summary();
    assert!(summary.is_configured);
    assert_eq!(summary.remaining, 750);

    let readiness = client.withdrawal_readiness(&150);
    assert!(readiness.is_ready);
    assert_eq!(readiness.claimable_now, 750);
}

#[test]
fn readiness_reports_missing_state() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(RewardStream, ());
    let client = RewardStreamClient::new(&env, &id);
    env.mock_all_auths();
    client.init(&admin);

    let readiness = client.withdrawal_readiness(&10);
    assert!(!readiness.is_ready);
    assert_eq!(readiness.blocked_reason_code, 4);
}

#[test]
fn stream_pressure_snapshot_reports_depletion_band() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(RewardStream, ());
    let client = RewardStreamClient::new(&env, &id);
    env.mock_all_auths();

    client.init(&admin);
    client.configure_stream(&admin, &27, &1_000, &800, &0, &false);

    let snapshot = client.stream_pressure_snapshot();
    assert!(snapshot.is_configured);
    assert_eq!(snapshot.stream_id, 27);
    assert_eq!(snapshot.remaining, 200);
    assert_eq!(snapshot.pressure_bps, 8_000);
    assert_eq!(snapshot.depletion_band, DepletionBand::Watch);
    assert_eq!(client.depletion_band(), DepletionBand::Watch);
}

#[test]
fn stream_pressure_snapshot_missing_is_predictable_zero_state() {
    let env = Env::default();
    let id = env.register(RewardStream, ());
    let client = RewardStreamClient::new(&env, &id);

    let snapshot = client.stream_pressure_snapshot();
    assert!(!snapshot.is_configured);
    assert_eq!(snapshot.stream_id, 0);
    assert_eq!(snapshot.remaining, 0);
    assert_eq!(snapshot.pressure_bps, 0);
    assert_eq!(snapshot.depletion_band, DepletionBand::NotConfigured);
}

#[test]
fn stream_performance_summary_success_path() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(RewardStream, ());
    let client = RewardStreamClient::new(&env, &id);
    env.mock_all_auths();

    client.init(&admin);
    // 600 withdrawn out of 1_000 allocated → utilization_bps = 6_000, remaining = 400
    client.configure_stream(&admin, &5, &1_000, &600, &0, &false);

    let summary = client.stream_performance_summary();
    assert!(summary.is_configured);
    assert_eq!(summary.stream_id, 5);
    assert_eq!(summary.total_allocated, 1_000);
    assert_eq!(summary.total_withdrawn, 600);
    assert_eq!(summary.remaining, 400);
    assert_eq!(summary.utilization_bps, 6_000);
    assert!(!summary.is_depleted);
    assert!(!summary.paused);
}

#[test]
fn stream_performance_summary_missing_is_zero_state() {
    let env = Env::default();
    let id = env.register(RewardStream, ());
    let client = RewardStreamClient::new(&env, &id);

    let summary = client.stream_performance_summary();
    assert!(!summary.is_configured);
    assert_eq!(summary.stream_id, 0);
    assert_eq!(summary.utilization_bps, 0);
    assert!(!summary.is_depleted);
}

#[test]
fn unlock_interval_accessor_before_and_after_unlock() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(RewardStream, ());
    let client = RewardStreamClient::new(&env, &id);
    env.mock_all_auths();

    client.init(&admin);
    // unlock_time = 200
    client.configure_stream(&admin, &7, &500, &0, &200, &false);

    // Before unlock: now=100, 100s remaining
    let before = client.unlock_interval_accessor(&100);
    assert!(before.is_configured);
    assert_eq!(before.unlock_time, 200);
    assert!(!before.is_past_unlock);
    assert_eq!(before.time_until_unlock, 100);

    // After unlock: now=300
    let after = client.unlock_interval_accessor(&300);
    assert!(after.is_past_unlock);
    assert_eq!(after.time_until_unlock, 0);
}

#[test]
fn unlock_interval_accessor_missing_returns_zero_state() {
    let env = Env::default();
    let id = env.register(RewardStream, ());
    let client = RewardStreamClient::new(&env, &id);

    let info = client.unlock_interval_accessor(&0);
    assert!(!info.is_configured);
    assert_eq!(info.unlock_time, 0);
    assert_eq!(info.time_until_unlock, 0);
    assert!(!info.is_past_unlock);
}
