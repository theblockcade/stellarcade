#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Address, Env};

fn setup<'a>() -> (Env, Address, WalletClaimsV2Client<'a>) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let contract_id = env.register(WalletClaimsV2, ());
    let client = WalletClaimsV2Client::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.init(&admin);
    (env, admin, client)
}

#[test]
fn claim_pressure_snapshot_counts_pending_matured_and_settled_claims() {
    let (env, admin, client) = setup();
    let wallet = Address::generate(&env);
    client.set_cooldown_policy(&admin, &wallet, &600u64, &100i128, &false);
    client.queue_claim(&admin, &1u64, &wallet, &150i128, &900u64);
    client.queue_claim(&admin, &2u64, &wallet, &90i128, &1_500u64);
    client.queue_claim(&admin, &3u64, &wallet, &250i128, &2_000u64);
    client.settle_claim(&admin, &1u64);

    let snapshot = client.claim_pressure_snapshot(&wallet);
    assert_eq!(snapshot.total_claims, 3);
    assert_eq!(snapshot.settled_claims, 1);
    assert_eq!(snapshot.pending_claims, 2);
    assert_eq!(snapshot.matured_claims, 0);
    assert_eq!(snapshot.pending_amount, 340);

    env.ledger().set_timestamp(1_600);
    let matured = client.claim_pressure_snapshot(&wallet);
    assert_eq!(matured.pending_claims, 1);
    assert_eq!(matured.matured_claims, 1);
}

#[test]
fn cooldown_threshold_accessor_returns_missing_defaults_and_blocking_window() {
    let (env, admin, client) = setup();
    let wallet = Address::generate(&env);

    let missing = client.cooldown_threshold_accessor(&wallet);
    assert_eq!(missing.policy_exists, false);
    assert_eq!(missing.currently_blocked, false);

    client.set_cooldown_policy(&admin, &wallet, &600u64, &100i128, &false);
    client.queue_claim(&admin, &9u64, &wallet, &200i128, &1_800u64);
    let blocked = client.cooldown_threshold_accessor(&wallet);
    assert_eq!(blocked.policy_exists, true);
    assert_eq!(blocked.currently_blocked, true);
    assert_eq!(blocked.next_available_at, 1_800);
    assert_eq!(blocked.seconds_until_next_window, 800);

    env.ledger().set_timestamp(1_900);
    let open = client.cooldown_threshold_accessor(&wallet);
    assert_eq!(open.currently_blocked, false);
    assert_eq!(open.seconds_until_next_window, 0);
}
