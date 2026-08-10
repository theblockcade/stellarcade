#![cfg(test)]
use super::*;
use crate::types::RiskLevel;
use soroban_sdk::Env;

fn setup() -> (Env, GrantLedgerClient<'static>) {
    let env = Env::default();
    let contract_id = env.register_contract(None, GrantLedger);
    let client = GrantLedgerClient::new(&env, &contract_id);
    (env, client)
}

#[test]
fn snapshot_reflects_allocations() {
    let (_env, client) = setup();
    client.create_grant(&1, &10_000);
    client.allocate(&1, &2_500);
    client.allocate(&1, &1_500);

    let snap = client.allocation_snapshot(&1);
    assert!(snap.grant_exists);
    assert_eq!(snap.total_budget, 10_000);
    assert_eq!(snap.allocated, 4_000);
    assert_eq!(snap.remaining, 6_000);
    assert_eq!(snap.allocation_count, 2);
}

#[test]
fn risk_bands_track_utilization() {
    let (_env, client) = setup();
    client.create_grant(&1, &10_000);

    // 40% allocated -> Low
    client.allocate(&1, &4_000);
    let r = client.exhaustion_risk(&1);
    assert_eq!(r.utilization_bps, 4_000);
    assert_eq!(r.risk_level, RiskLevel::Low);

    // 80% allocated -> High
    client.allocate(&1, &4_000);
    assert_eq!(client.exhaustion_risk(&1).risk_level, RiskLevel::High);

    // 100% allocated -> Exhausted
    client.allocate(&1, &2_000);
    let r = client.exhaustion_risk(&1);
    assert_eq!(r.remaining, 0);
    assert_eq!(r.utilization_bps, 10_000);
    assert_eq!(r.risk_level, RiskLevel::Exhausted);
}

#[test]
#[should_panic(expected = "allocation exceeds remaining budget")]
fn over_allocation_is_rejected() {
    let (_env, client) = setup();
    client.create_grant(&1, &1_000);
    client.allocate(&1, &1_500);
}

#[test]
fn missing_grant_returns_predictable_state() {
    let (_env, client) = setup();

    let snap = client.allocation_snapshot(&99);
    assert!(!snap.grant_exists);
    assert_eq!(snap.total_budget, 0);

    let risk = client.exhaustion_risk(&99);
    assert!(!risk.grant_exists);
    assert_eq!(risk.risk_level, RiskLevel::Unknown);
}

#[test]
fn grant_allocation_summary_combines_snapshot_and_risk() {
    let (_env, client) = setup();
    client.create_grant(&1, &10_000);
    client.allocate(&1, &8_500);

    let summary = client.grant_allocation_summary(&1);
    assert!(summary.grant_exists);
    assert!(summary.is_active);
    assert_eq!(summary.total_budget, 10_000);
    assert_eq!(summary.allocated, 8_500);
    assert_eq!(summary.remaining, 1_500);
    assert_eq!(summary.allocation_count, 1);
    assert_eq!(summary.utilization_bps, 8_500);
    assert_eq!(summary.risk_level, RiskLevel::High);
}

#[test]
fn grant_allocation_summary_missing_grant() {
    let (_env, client) = setup();
    let summary = client.grant_allocation_summary(&99);
    assert!(!summary.grant_exists);
    assert!(!summary.is_active);
    assert_eq!(summary.risk_level, RiskLevel::Unknown);
}

#[test]
fn milestone_window_estimates_calls_until_exhaustion() {
    let (_env, client) = setup();
    client.create_grant(&1, &10_000);
    // avg allocation = 2000; remaining = 10_000 - 4000 = 6000; calls = 3
    client.allocate(&1, &2_000);
    client.allocate(&1, &2_000);

    let mw = client.milestone_window(&1);
    assert!(mw.grant_exists);
    assert!(mw.has_estimate);
    assert_eq!(mw.avg_allocation_per_call, 2_000);
    assert_eq!(mw.remaining, 6_000);
    assert_eq!(mw.calls_until_exhaustion, 3);
}

#[test]
fn milestone_window_no_estimate_with_one_allocation() {
    let (_env, client) = setup();
    client.create_grant(&1, &10_000);
    client.allocate(&1, &3_000);

    let mw = client.milestone_window(&1);
    assert!(mw.grant_exists);
    assert!(!mw.has_estimate);
    assert_eq!(mw.avg_allocation_per_call, 0);
    assert_eq!(mw.calls_until_exhaustion, 0);
}

#[test]
fn milestone_window_missing_grant() {
    let (_env, client) = setup();
    let mw = client.milestone_window(&99);
    assert!(!mw.grant_exists);
    assert!(!mw.has_estimate);
}
