#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (FeeShieldClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register(FeeShield, ());
    let client = FeeShieldClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin)
}

#[test]
fn protected_balance_and_risk_track_fee_charges() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    client.upsert_shield(&admin, &5, &200, &600, &false);
    client.charge_fee(&admin, &5, &150);

    let summary = client.protected_balance_summary(&5);
    assert!(summary.exists);
    assert_eq!(summary.state, ShieldState::Protected);
    assert_eq!(summary.current_balance, 450);
    assert_eq!(summary.spendable_balance, 250);
    assert_eq!(summary.charge_count, 1);
    assert!(summary.can_charge);

    let risk = client.depletion_risk(&5);
    assert_eq!(risk.spendable_bps, 5_555);
    assert_eq!(risk.risk_level, DepletionRiskLevel::None);
    assert!(!risk.will_block_next_charge);
}

#[test]
fn paused_and_missing_shields_return_predictable_reads() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FeeShield, ());
    let client = FeeShieldClient::new(&env, &contract_id);

    let before_init = client.protected_balance_summary(&9);
    assert!(!before_init.configured);
    assert_eq!(before_init.state, ShieldState::NotConfigured);

    let admin = Address::generate(&env);
    client.init(&admin);
    client.upsert_shield(&admin, &9, &300, &300, &true);

    let paused = client.protected_balance_summary(&9);
    assert!(paused.exists);
    assert_eq!(paused.state, ShieldState::Paused);
    assert!(!paused.can_charge);

    let missing = client.depletion_risk(&404);
    assert!(missing.configured);
    assert!(!missing.exists);
    assert_eq!(missing.spendable_bps, 0);
    assert_eq!(missing.risk_level, DepletionRiskLevel::None);
}

#[test]
fn reserve_coverage_snapshot_depleted_when_spendable_zero() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    // protected_balance == current_balance → spendable == 0.
    client.upsert_shield(&admin, &1, &500, &500, &false);

    let summary = client.protected_balance_summary(&1);
    assert!(summary.exists);
    assert_eq!(summary.state, ShieldState::Depleted);
    assert_eq!(summary.spendable_balance, 0);
    assert!(!summary.can_charge);

    let risk = client.depletion_risk(&1);
    assert_eq!(risk.spendable_bps, 0);
    assert_eq!(risk.risk_level, DepletionRiskLevel::Critical);
    assert!(risk.will_block_next_charge);
}

#[test]
fn emergency_gap_accessor_risk_levels_are_correctly_assigned() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    // spendable_bps = 800 → High risk (0..=1_000).
    client.upsert_shield(&admin, &10, &920, &1_000, &false);
    let risk_high = client.depletion_risk(&10);
    assert_eq!(risk_high.risk_level, DepletionRiskLevel::High);

    // spendable_bps = 2_000 → Medium risk (1_001..=2_500).
    client.upsert_shield(&admin, &11, &800, &1_000, &false);
    let risk_medium = client.depletion_risk(&11);
    assert_eq!(risk_medium.risk_level, DepletionRiskLevel::Medium);

    // spendable_bps = 4_000 → Low risk (2_501..=5_000).
    client.upsert_shield(&admin, &12, &600, &1_000, &false);
    let risk_low = client.depletion_risk(&12);
    assert_eq!(risk_low.risk_level, DepletionRiskLevel::Low);

    // spendable_bps = 9_000 → None (>5_000).
    client.upsert_shield(&admin, &13, &100, &1_000, &false);
    let risk_none = client.depletion_risk(&13);
    assert_eq!(risk_none.risk_level, DepletionRiskLevel::None);
    assert!(!risk_none.will_block_next_charge);
}
