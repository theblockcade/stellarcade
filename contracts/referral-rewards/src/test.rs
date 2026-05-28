use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup_client(env: &Env) -> (ReferralRewardsClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let inviter = Address::generate(env);
    let contract_id = env.register_contract(None, ReferralRewards);
    let client = ReferralRewardsClient::new(env, &contract_id);
    client.init(&admin, &100);
    (client, admin, inviter)
}

#[test]
fn test_earnings_summary_and_claim_readiness_happy_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, inviter) = setup_client(&env);

    client.record_earning(&admin, &inviter, &250, &3);
    client.record_claim(&admin, &inviter, &80);

    let summary = client.inviter_earnings_summary(&inviter);
    assert!(summary.exists);
    assert_eq!(summary.total_earned, 250);
    assert_eq!(summary.pending_rewards, 170);

    let readiness = client.claim_readiness(&inviter);
    assert!(readiness.ready);
    assert_eq!(readiness.blocker, None);
}

#[test]
fn test_missing_inviter_returns_predictable_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _inviter) = setup_client(&env);
    let unknown = Address::generate(&env);

    let summary = client.inviter_earnings_summary(&unknown);
    assert!(!summary.exists);
    assert_eq!(summary.pending_rewards, 0);

    let readiness = client.claim_readiness(&unknown);
    assert!(!readiness.exists);
    assert_eq!(
        readiness.blocker,
        Some(String::from_str(&env, "missing_inviter"))
    );
}
