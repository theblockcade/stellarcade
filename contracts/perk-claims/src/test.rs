#![cfg(test)]
use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup() -> (Env, PerkClaimsClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, PerkClaims);
    let client = PerkClaimsClient::new(&env, &contract_id);
    (env, client)
}

#[test]
fn queue_then_claim_when_threshold_met() {
    let (env, client) = setup();
    client.configure_perk(&1, &2);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.queue_claim(&1, &alice);
    client.queue_claim(&1, &alice); // idempotent
    let snap = client.claim_queue_snapshot(&1);
    assert_eq!(snap.queued_count, 1);
    assert!(!snap.is_threshold_met);
    assert_eq!(client.threshold_gap(&1).gap, 1);
    assert_eq!(client.threshold_gap(&1).progress_bps, 5_000);

    client.queue_claim(&1, &bob);
    let snap = client.claim_queue_snapshot(&1);
    assert_eq!(snap.queued_count, 2);
    assert!(snap.is_threshold_met);
    assert_eq!(client.threshold_gap(&1).gap, 0);
    assert_eq!(client.threshold_gap(&1).progress_bps, 10_000);

    client.claim(&1, &alice);
    assert_eq!(client.claim_queue_snapshot(&1).claimed_count, 1);
}

#[test]
#[should_panic(expected = "claim threshold not met")]
fn claim_before_threshold_is_rejected() {
    let (env, client) = setup();
    client.configure_perk(&1, &3);
    let alice = Address::generate(&env);
    client.queue_claim(&1, &alice);
    client.claim(&1, &alice);
}

#[test]
#[should_panic(expected = "caller is not queued")]
fn claim_without_queueing_is_rejected() {
    let (env, client) = setup();
    client.configure_perk(&1, &1);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    client.queue_claim(&1, &alice); // meets threshold of 1
    client.claim(&1, &bob); // bob never queued
}

#[test]
fn missing_perk_returns_predictable_state() {
    let (_env, client) = setup();

    let snap = client.claim_queue_snapshot(&42);
    assert!(!snap.perk_exists);
    assert_eq!(snap.queued_count, 0);
    assert!(!snap.is_threshold_met);

    let gap = client.threshold_gap(&42);
    assert!(!gap.perk_exists);
    assert_eq!(gap.gap, 0);
}
