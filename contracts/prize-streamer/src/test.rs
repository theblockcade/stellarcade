#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use super::*;

fn setup(env: &Env) -> (PrizeStreamerClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register(PrizeStreamer, ());
    let client = PrizeStreamerClient::new(env, &contract_id);
    env.mock_all_auths();
    client.init(&admin);
    (client, admin)
}

// ---------------------------------------------------------------------------
// stream_outflow_summary — success path
// ---------------------------------------------------------------------------

#[test]
fn test_stream_outflow_summary_success() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_stream(
        &admin, &1, &50_000, &100, &1_000_000, &true, &200_000, &300_000,
    );

    let summary = client.stream_outflow_summary(&1);
    assert!(summary.exists);
    assert_eq!(summary.stream_id, 1);
    assert_eq!(summary.total_streamed, 50_000);
    assert_eq!(summary.outflow_rate_per_ledger, 100);
    assert_eq!(summary.last_outflow_ledger, 1_000_000);
    assert!(summary.is_draining);
}

// ---------------------------------------------------------------------------
// stream_outflow_summary — paused stream
// ---------------------------------------------------------------------------

#[test]
fn test_stream_outflow_summary_paused() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_stream(
        &admin, &2, &10_000, &50, &900_000, &false, &100_000, &200_000,
    );

    let summary = client.stream_outflow_summary(&2);
    assert!(summary.exists);
    assert!(!summary.is_draining);
}

// ---------------------------------------------------------------------------
// stream_outflow_summary — missing stream returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_stream_outflow_summary_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let summary = client.stream_outflow_summary(&99);
    assert!(!summary.exists);
    assert_eq!(summary.stream_id, 99);
    assert_eq!(summary.total_streamed, 0);
    assert_eq!(summary.outflow_rate_per_ledger, 0);
    assert_eq!(summary.last_outflow_ledger, 0);
    assert!(!summary.is_draining);
}

// ---------------------------------------------------------------------------
// funding_gap — underfunded stream
// ---------------------------------------------------------------------------

#[test]
fn test_funding_gap_underfunded() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    // total_funding=100_000, total_streamed=80_000 → balance=20_000
    // funding_target=300_000 → gap=280_000
    client.upsert_stream(
        &admin, &3, &80_000, &100, &1_000_000, &true, &100_000, &300_000,
    );

    let gap = client.funding_gap(&3);
    assert!(gap.exists);
    assert_eq!(gap.stream_id, 3);
    assert_eq!(gap.total_funding, 100_000);
    assert_eq!(gap.current_balance, 20_000);
    assert_eq!(gap.gap_amount, 280_000);
    assert!(gap.is_underfunded);
}

// ---------------------------------------------------------------------------
// funding_gap — fully funded stream
// ---------------------------------------------------------------------------

#[test]
fn test_funding_gap_fully_funded() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    // total_funding=500_000, total_streamed=100_000 → balance=400_000
    // funding_target=300_000 → gap=0, not underfunded
    client.upsert_stream(
        &admin, &4, &100_000, &200, &2_000_000, &true, &500_000, &300_000,
    );

    let gap = client.funding_gap(&4);
    assert!(gap.exists);
    assert_eq!(gap.current_balance, 400_000);
    assert_eq!(gap.gap_amount, 0);
    assert!(!gap.is_underfunded);
}

// ---------------------------------------------------------------------------
// funding_gap — missing stream returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_funding_gap_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let gap = client.funding_gap(&999);
    assert!(!gap.exists);
    assert_eq!(gap.stream_id, 999);
    assert_eq!(gap.total_funding, 0);
    assert_eq!(gap.current_balance, 0);
    assert_eq!(gap.gap_amount, 0);
    assert!(!gap.is_underfunded);
}

// ---------------------------------------------------------------------------
// release_interval and stream_disbursement_snapshot tests
// ---------------------------------------------------------------------------

#[test]
fn test_release_interval_getter_setter() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    assert_eq!(client.release_interval(), 0);

    client.set_release_interval(&admin, &50);
    assert_eq!(client.release_interval(), 50);
}

#[test]
fn test_stream_disbursement_snapshot() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.set_release_interval(&admin, &120);

    // Test missing stream
    let snapshot_missing = client.stream_disbursement_snapshot(&99);
    assert!(!snapshot_missing.exists);
    assert_eq!(snapshot_missing.release_interval, 120);
    assert_eq!(snapshot_missing.total_streamed, 0);

    // Test existing stream
    client.upsert_stream(
        &admin, &5, &15_000, &100, &1_200_000, &true, &100_000, &200_000,
    );
    let snapshot = client.stream_disbursement_snapshot(&5);
    assert!(snapshot.exists);
    assert_eq!(snapshot.stream_id, 5);
    assert_eq!(snapshot.total_streamed, 15_000);
    assert_eq!(snapshot.last_outflow_ledger, 1_200_000);
    assert_eq!(snapshot.release_interval, 120);
    assert!(snapshot.is_draining);
}
