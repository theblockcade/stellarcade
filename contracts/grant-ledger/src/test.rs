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
