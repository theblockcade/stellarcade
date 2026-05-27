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
