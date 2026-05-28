#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::Env;

fn setup() -> (Env, LobbyGatesClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, LobbyGates);
    let client = LobbyGatesClient::new(&env, &contract_id);
    (env, client)
}

#[test]
fn status_and_release_delay_track_time() {
    let (env, client) = setup();
    client.configure_gate(&1, &3, &100);

    // Before release.
    let status = client.gate_status(&1);
    assert!(status.gate_exists);
    assert!(!status.is_open);
    assert_eq!(status.remaining_slots, 3);

    let delay = client.release_delay(&1);
    assert!(!delay.is_released);
    assert_eq!(delay.seconds_until_release, 100);

    // After release.
    env.ledger().with_mut(|li| li.timestamp = 150);
    assert!(client.gate_status(&1).is_open);
    assert!(client.release_delay(&1).is_released);
    assert_eq!(client.release_delay(&1).seconds_until_release, 0);
}

#[test]
fn entry_fills_capacity_and_is_idempotent() {
    let (env, client) = setup();
    client.configure_gate(&1, &2, &100);
    env.ledger().with_mut(|li| li.timestamp = 200);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.enter(&1, &alice);
    client.enter(&1, &alice); // re-entry is a no-op
    client.enter(&1, &bob);

    let status = client.gate_status(&1);
    assert_eq!(status.occupancy, 2);
    assert_eq!(status.remaining_slots, 0);
    assert!(status.is_full);
}

#[test]
#[should_panic(expected = "gate is not released yet")]
fn entry_before_release_is_rejected() {
    let (env, client) = setup();
    client.configure_gate(&1, &2, &100);
    let alice = Address::generate(&env);
    // time 0 < release 100
    client.enter(&1, &alice);
}

#[test]
fn missing_gate_returns_predictable_state() {
    let (_env, client) = setup();

    let status = client.gate_status(&99);
    assert!(!status.gate_exists);
    assert!(!status.is_open);
    assert_eq!(status.capacity, 0);

    let delay = client.release_delay(&99);
    assert!(!delay.gate_exists);
    assert!(!delay.is_released);
}
