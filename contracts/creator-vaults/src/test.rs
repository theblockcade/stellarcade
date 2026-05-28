#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::Env;

fn setup() -> (Env, CreatorVaultsClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, CreatorVaults);
    let client = CreatorVaultsClient::new(&env, &contract_id);
    (env, client)
}

#[test]
fn deposit_then_summary_reflects_liability() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.deposit(&alice, &1_000, &100);
    client.deposit(&bob, &500, &50);

    let summary = client.liability_summary();
    assert_eq!(summary.total_vaults, 2);
    assert_eq!(summary.active_vaults, 2);
    assert_eq!(summary.total_locked, 1_500);
    // current time is 0, both unlock in the future -> nothing unlockable yet.
    assert_eq!(summary.total_unlockable, 0);
}

#[test]
fn unlock_readiness_tracks_time() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    client.deposit(&alice, &1_000, &100);

    let before = client.unlock_readiness(&alice);
    assert!(before.vault_exists);
    assert!(!before.is_unlockable);
    assert_eq!(before.seconds_until_unlock, 100);

    env.ledger().with_mut(|li| li.timestamp = 150);
    let after = client.unlock_readiness(&alice);
    assert!(after.is_unlockable);
    assert_eq!(after.seconds_until_unlock, 0);

    // The now-matured vault counts toward unlockable liability.
    let summary = client.liability_summary();
    assert_eq!(summary.total_unlockable, 1_000);
}

#[test]
fn withdraw_after_unlock_clears_vault() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    client.deposit(&alice, &1_000, &100);

    env.ledger().with_mut(|li| li.timestamp = 200);
    let withdrawn = client.withdraw(&alice);
    assert_eq!(withdrawn, 1_000);

    let summary = client.liability_summary();
    assert_eq!(summary.active_vaults, 0);
    assert_eq!(summary.total_locked, 0);
}

#[test]
#[should_panic(expected = "vault is still locked")]
fn withdraw_before_unlock_panics() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    client.deposit(&alice, &1_000, &100);
    // Still time 0 < unlock_time 100.
    client.withdraw(&alice);
}

#[test]
fn missing_vault_returns_zero_state() {
    let (env, client) = setup();
    let unknown = Address::generate(&env);

    let readiness = client.unlock_readiness(&unknown);
    assert!(!readiness.vault_exists);
    assert!(!readiness.is_unlockable);
    assert_eq!(readiness.locked_amount, 0);

    let summary = client.liability_summary();
    assert_eq!(summary.total_vaults, 0);
    assert_eq!(summary.total_locked, 0);
}
