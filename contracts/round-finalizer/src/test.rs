#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::DISPUTE_WINDOW_LEDGERS;
use crate::{RoundFinalizerContract, RoundFinalizerContractClient};

#[test]
fn unresolved_summary_and_readiness_happy_path() {
    let env = Env::default();
    let id = env.register(RoundFinalizerContract, ());
    let client = RoundFinalizerContractClient::new(&env, &id);
    let admin = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);
    client.upsert_round(&admin, &10, &2, &true);
    client.upsert_round(&admin, &11, &0, &true);

    let summary = client.get_unresolved_round_summary();
    assert_eq!(summary.total_rounds, 2);
    assert_eq!(summary.unresolved_rounds, 1);
    assert_eq!(summary.unresolved_ops, 2);
    assert_eq!(summary.next_unresolved_round_id, 10);

    let readiness = client.get_finalize_readiness(&11);
    assert!(readiness.is_ready);
    assert_eq!(readiness.unresolved_ops, 0);
    assert!(!readiness.missing_checkpoint);

    let active = client.active_round_summary();
    assert_eq!(active.total_rounds, 2);
    assert_eq!(active.active_rounds, 1);
    assert_eq!(active.ready_rounds, 1);
    assert_eq!(active.blocked_rounds, 1);
    assert_eq!(active.next_active_round_id, 10);

    let pressure = client.finalization_pressure();
    assert_eq!(pressure.total_rounds, 2);
    assert_eq!(pressure.blocked_rounds, 1);
    assert_eq!(pressure.unresolved_ops, 2);
    assert_eq!(pressure.pressure_bps, 5_000);
}

#[test]
fn unresolved_summary_unconfigured_and_missing_round() {
    let env = Env::default();
    let id = env.register(RoundFinalizerContract, ());
    let client = RoundFinalizerContractClient::new(&env, &id);

    let summary = client.get_unresolved_round_summary();
    assert_eq!(summary.total_rounds, 0);
    assert_eq!(summary.unresolved_rounds, 0);

    let readiness = client.get_finalize_readiness(&99);
    assert!(!readiness.is_ready);
    assert!(readiness.missing_checkpoint);

    let active = client.active_round_summary();
    assert_eq!(active.total_rounds, 0);
    assert_eq!(active.active_rounds, 0);

    let pressure = client.finalization_pressure();
    assert_eq!(pressure.total_rounds, 0);
    assert_eq!(pressure.pressure_bps, 0);
}

#[test]
fn dispute_window_returns_constant() {
    let env = Env::default();
    let id = env.register(RoundFinalizerContract, ());
    let client = RoundFinalizerContractClient::new(&env, &id);
    assert_eq!(client.dispute_window_ledgers(), DISPUTE_WINDOW_LEDGERS);
}

#[test]
fn finalization_status_summary_unconfigured() {
    let env = Env::default();
    let id = env.register(RoundFinalizerContract, ());
    let client = RoundFinalizerContractClient::new(&env, &id);

    let summary = client.finalization_status_summary();
    assert_eq!(summary.total_rounds, 0);
    assert_eq!(summary.finalized_rounds, 0);
    assert_eq!(summary.unresolved_rounds, 0);
    assert_eq!(summary.dispute_window_ledgers, DISPUTE_WINDOW_LEDGERS);
    assert!(!summary.finalization_paused);
}

#[test]
fn finalization_status_summary_counts_finalized_and_unresolved() {
    let env = Env::default();
    let id = env.register(RoundFinalizerContract, ());
    let client = RoundFinalizerContractClient::new(&env, &id);
    let admin = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);
    // Round 1: finalized (no unresolved ops, has checkpoint)
    client.upsert_round(&admin, &1, &0, &true);
    // Round 2: unresolved (pending ops)
    client.upsert_round(&admin, &2, &3, &true);
    // Round 3: unresolved (missing checkpoint)
    client.upsert_round(&admin, &3, &0, &false);

    let summary = client.finalization_status_summary();
    assert_eq!(summary.total_rounds, 3);
    assert_eq!(summary.finalized_rounds, 1);
    assert_eq!(summary.unresolved_rounds, 2);
    assert!(!summary.finalization_paused);
}

#[test]
fn finalization_status_summary_reflects_paused() {
    let env = Env::default();
    let id = env.register(RoundFinalizerContract, ());
    let client = RoundFinalizerContractClient::new(&env, &id);
    let admin = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);
    client.set_paused(&admin, &true);

    let summary = client.finalization_status_summary();
    assert!(summary.finalization_paused);
}
