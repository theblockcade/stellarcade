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
