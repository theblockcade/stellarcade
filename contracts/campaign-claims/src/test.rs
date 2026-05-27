#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(env: &Env) -> (CampaignClaimsClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let user = Address::generate(env);
    let contract_id = env.register(CampaignClaims, ());
    let client = CampaignClaimsClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, user)
}

#[test]
fn claim_window_and_exhaustion_track_success_path() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 150);

    let (client, admin, user) = setup(&env);
    client.upsert_campaign(&admin, &7, &1_000, &100, &300, &false);
    client.record_claim(&admin, &7, &user, &250);

    let summary = client.claim_window_summary(&7);
    assert!(summary.configured);
    assert!(summary.exists);
    assert_eq!(summary.state, ClaimWindowState::Open);
    assert_eq!(summary.budget, 1_000);
    assert_eq!(summary.remaining_budget, 750);
    assert_eq!(summary.pending_claimants, 1);

    let exhaustion = client.budget_exhaustion(&7);
    assert_eq!(exhaustion.committed_budget, 250);
    assert_eq!(exhaustion.claimed_budget, 0);
    assert_eq!(exhaustion.exhaustion_bps, 2_500);
    assert!(exhaustion.can_record_claims);

    let claimed = client.claim(&user, &7);
    assert_eq!(claimed, 250);

    let after_claim = client.budget_exhaustion(&7);
    assert_eq!(after_claim.claimed_budget, 250);
    assert_eq!(after_claim.remaining_budget, 750);

    let after_summary = client.claim_window_summary(&7);
    assert_eq!(after_summary.pending_claimants, 0);
    assert_eq!(after_summary.total_claims, 1);

    let saturation = client.claim_saturation_summary(&7);
    assert_eq!(saturation.saturation_bps, 2_500);
    assert_eq!(saturation.claimed_budget, 250);
    assert!(!saturation.saturated);

    let cooldown = client.cooldown_window_accessor(&7);
    assert_eq!(cooldown.state, ClaimWindowState::Open);
    assert_eq!(cooldown.seconds_until_open, 0);
    assert_eq!(cooldown.seconds_until_closed, 150);
}

#[test]
fn not_configured_and_missing_campaign_reads_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CampaignClaims, ());
    let client = CampaignClaimsClient::new(&env, &contract_id);

    let before_init = client.claim_window_summary(&404);
    assert!(!before_init.configured);
    assert!(!before_init.exists);
    assert_eq!(before_init.state, ClaimWindowState::NotConfigured);
    assert_eq!(before_init.budget, 0);

    let admin = Address::generate(&env);
    client.init(&admin);

    let missing = client.budget_exhaustion(&404);
    assert!(missing.configured);
    assert!(!missing.exists);
    assert_eq!(missing.state, ClaimWindowState::Missing);
    assert_eq!(missing.exhaustion_bps, 0);
    assert!(!missing.can_record_claims);

    let cooldown = client.cooldown_window_accessor(&404);
    assert!(cooldown.configured);
    assert!(!cooldown.exists);
    assert_eq!(cooldown.state, ClaimWindowState::Missing);
    assert_eq!(cooldown.seconds_until_open, 0);
    assert_eq!(cooldown.seconds_until_closed, 0);
}
