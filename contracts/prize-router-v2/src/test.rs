#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (PrizeRouterV2ContractClient<'_>, Address) {
    let admin = Address::generate(env);
    let id = env.register(PrizeRouterV2Contract, ());
    let client = PrizeRouterV2ContractClient::new(env, &id);
    client.init(&admin);
    (client, admin)
}

#[test]
fn test_route_pressure_empty_queue() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let summary = client.route_pressure_summary();
    assert_eq!(summary.pending_count, 0);
    assert_eq!(summary.total_pending_amount, 0);
    assert_eq!(summary.releasable_count, 0);
    assert!(!summary.overloaded);
}

#[test]
fn test_payout_delay_not_found() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let info = client.payout_delay(&0);
    assert!(!info.found);
    assert!(!info.releasable);
    assert_eq!(info.ledgers_remaining, 0);
}

#[test]
fn test_enqueue_and_pressure_summary() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let recipient = Address::generate(&env);
    client.set_delay(&admin, &10);

    let idx = client.enqueue_payout(&admin, &recipient, &500);
    assert_eq!(idx, 0);

    let summary = client.route_pressure_summary();
    assert_eq!(summary.pending_count, 1);
    assert_eq!(summary.total_pending_amount, 500);
    // Not yet releasable because delay=10 ledgers hasn't elapsed
    assert_eq!(summary.releasable_count, 0);
    assert!(!summary.overloaded);
}

#[test]
fn test_payout_delay_pending() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    client.set_delay(&admin, &100);
    let recipient = Address::generate(&env);
    let idx = client.enqueue_payout(&admin, &recipient, &1000);

    let info = client.payout_delay(&idx);
    assert!(info.found);
    assert!(!info.releasable);
    assert!(info.ledgers_remaining > 0);
}

#[test]
fn test_overloaded_flag() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    // Set threshold to 2 so 3 payouts trigger overloaded
    client.set_pressure_threshold(&admin, &2);
    client.set_delay(&admin, &1000);

    let r = Address::generate(&env);
    client.enqueue_payout(&admin, &r, &100);
    client.enqueue_payout(&admin, &r, &100);
    client.enqueue_payout(&admin, &r, &100);

    let summary = client.route_pressure_summary();
    assert!(summary.overloaded);
}
