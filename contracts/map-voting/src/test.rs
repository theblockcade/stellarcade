#![cfg(test)]

use soroban_sdk::{testutils::{Address as _, Ledger as _}, Address, Env};

use super::*;

fn setup(env: &Env) -> (MapVotingClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register(MapVoting, ());
    let client = MapVotingClient::new(env, &contract_id);
    env.mock_all_auths();
    client.init(&admin);
    (client, admin)
}

// ---------------------------------------------------------------------------
// ballot_participation_snapshot — success path
// ---------------------------------------------------------------------------

#[test]
fn test_ballot_participation_snapshot_success() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    // 400 of 1000 eligible voters have voted → 40% = 4000 bps
    client.upsert_round(&admin, &1, &1000, &400, &true, &false, &0, &0);

    let snap = client.ballot_participation_snapshot(&1);
    assert!(snap.exists);
    assert_eq!(snap.round_id, 1);
    assert_eq!(snap.eligible_voters, 1000);
    assert_eq!(snap.votes_cast, 400);
    assert_eq!(snap.participation_bps, 4000);
    assert!(snap.round_active);
}

// ---------------------------------------------------------------------------
// ballot_participation_snapshot — full participation
// ---------------------------------------------------------------------------

#[test]
fn test_ballot_participation_snapshot_full() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_round(&admin, &2, &500, &500, &false, &false, &0, &0);

    let snap = client.ballot_participation_snapshot(&2);
    assert!(snap.exists);
    assert_eq!(snap.participation_bps, 10_000);
    assert!(!snap.round_active);
}

// ---------------------------------------------------------------------------
// ballot_participation_snapshot — zero eligible voters
// ---------------------------------------------------------------------------

#[test]
fn test_ballot_participation_snapshot_zero_eligible() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_round(&admin, &3, &0, &0, &false, &false, &0, &0);

    let snap = client.ballot_participation_snapshot(&3);
    assert!(snap.exists);
    assert_eq!(snap.participation_bps, 0);
}

// ---------------------------------------------------------------------------
// ballot_participation_snapshot — missing round returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_ballot_participation_snapshot_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let snap = client.ballot_participation_snapshot(&99);
    assert!(!snap.exists);
    assert_eq!(snap.round_id, 99);
    assert_eq!(snap.eligible_voters, 0);
    assert_eq!(snap.votes_cast, 0);
    assert_eq!(snap.participation_bps, 0);
    assert!(!snap.round_active);
}

// ---------------------------------------------------------------------------
// tiebreak_window — window open
// ---------------------------------------------------------------------------

#[test]
fn test_tiebreak_window_open() {
    let env = Env::default();
    env.ledger().set_sequence_number(150);
    let (client, admin) = setup(&env);

    client.upsert_round(&admin, &4, &200, &200, &false, &true, &100, &200);

    let tw = client.tiebreak_window(&4);
    assert!(tw.exists);
    assert!(tw.tiebreak_required);
    assert!(tw.window_open);
    assert_eq!(tw.window_start, 100);
    assert_eq!(tw.window_end, 200);
}

// ---------------------------------------------------------------------------
// tiebreak_window — window closed (past end)
// ---------------------------------------------------------------------------

#[test]
fn test_tiebreak_window_closed_past_end() {
    let env = Env::default();
    env.ledger().set_sequence_number(250);
    let (client, admin) = setup(&env);

    client.upsert_round(&admin, &5, &200, &200, &false, &true, &100, &200);

    let tw = client.tiebreak_window(&5);
    assert!(tw.exists);
    assert!(tw.tiebreak_required);
    assert!(!tw.window_open); // past window_end
}

// ---------------------------------------------------------------------------
// tiebreak_window — no tiebreak required
// ---------------------------------------------------------------------------

#[test]
fn test_tiebreak_window_not_required() {
    let env = Env::default();
    env.ledger().set_sequence_number(150);
    let (client, admin) = setup(&env);

    client.upsert_round(&admin, &6, &300, &300, &false, &false, &100, &200);

    let tw = client.tiebreak_window(&6);
    assert!(tw.exists);
    assert!(!tw.tiebreak_required);
    assert!(!tw.window_open);
}

// ---------------------------------------------------------------------------
// tiebreak_window — missing round returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_tiebreak_window_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let tw = client.tiebreak_window(&999);
    assert!(!tw.exists);
    assert_eq!(tw.round_id, 999);
    assert_eq!(tw.window_start, 0);
    assert_eq!(tw.window_end, 0);
    assert!(!tw.tiebreak_required);
    assert!(!tw.window_open);
}
