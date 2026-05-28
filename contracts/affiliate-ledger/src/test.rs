#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (AffiliateLedgerContractClient<'_>, Address) {
    let admin = Address::generate(env);
    let id = env.register(AffiliateLedgerContract, ());
    let client = AffiliateLedgerContractClient::new(env, &id);
    client.init(&admin);
    (client, admin)
}

#[test]
fn test_referral_volume_summary_not_found() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let summary = client.referral_volume_summary(&Address::generate(&env));
    assert!(!summary.exists);
    assert_eq!(summary.referral_count, 0);
    assert_eq!(summary.unpaid_balance, 0);
}

#[test]
fn test_payout_eligibility_not_found() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let eligibility = client.payout_eligibility(&Address::generate(&env));
    assert!(!eligibility.eligible);
    assert!(!eligibility.account_active);
    assert_eq!(eligibility.claimable_amount, 0);
}

#[test]
fn test_record_referral_and_summary() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let affiliate = Address::generate(&env);
    client.register_affiliate(&admin, &affiliate);
    // Default commission = 5% (500 bps)
    client.record_referral(&admin, &affiliate, &1000);

    let summary = client.referral_volume_summary(&affiliate);
    assert!(summary.exists);
    assert_eq!(summary.referral_count, 1);
    assert_eq!(summary.total_volume, 1000);
    assert_eq!(summary.total_commission_earned, 50); // 5% of 1000
    assert_eq!(summary.unpaid_balance, 50);
}

#[test]
fn test_payout_eligibility_below_threshold() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let affiliate = Address::generate(&env);
    client.register_affiliate(&admin, &affiliate);
    // threshold = 100, record small referral to earn < 100 commission
    client.record_referral(&admin, &affiliate, &100); // 5% = 5 commission

    let eligibility = client.payout_eligibility(&affiliate);
    assert!(!eligibility.eligible); // 5 < 100 threshold
    assert_eq!(eligibility.claimable_amount, 5);
    assert_eq!(eligibility.minimum_threshold, 100);
    assert!(eligibility.account_active);
}

#[test]
fn test_payout_eligibility_meets_threshold() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let affiliate = Address::generate(&env);
    client.register_affiliate(&admin, &affiliate);
    // 5% of 5000 = 250 > threshold 100
    client.record_referral(&admin, &affiliate, &5000);

    let eligibility = client.payout_eligibility(&affiliate);
    assert!(eligibility.eligible);
    assert_eq!(eligibility.claimable_amount, 250);
}

#[test]
fn test_record_payout_reduces_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let affiliate = Address::generate(&env);
    client.register_affiliate(&admin, &affiliate);
    client.record_referral(&admin, &affiliate, &5000); // 250 commission
    client.record_payout(&admin, &affiliate, &100);

    let summary = client.referral_volume_summary(&affiliate);
    assert_eq!(summary.total_commission_paid, 100);
    assert_eq!(summary.unpaid_balance, 150);
}
