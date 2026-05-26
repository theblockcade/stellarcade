#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use super::*;

fn setup(env: &Env) -> (LadderSeasonsClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register(LadderSeasons, ());
    let client = LadderSeasonsClient::new(env, &contract_id);
    env.mock_all_auths();
    client.init(&admin);
    (client, admin)
}

// ---------------------------------------------------------------------------
// season_transition_snapshot — success path
// ---------------------------------------------------------------------------

#[test]
fn test_season_transition_snapshot_success() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &1, &500, &9800, &1_000_000, &false,
        &7500, &50, &1_100_000, &true,
    );

    let snap = client.season_transition_snapshot(&1);
    assert!(snap.exists);
    assert_eq!(snap.season_id, 1);
    assert_eq!(snap.total_participants, 500);
    assert_eq!(snap.top_score, 9800);
    assert_eq!(snap.ended_at_ledger, 1_000_000);
    assert!(!snap.was_paused);
}

// ---------------------------------------------------------------------------
// season_transition_snapshot — paused season
// ---------------------------------------------------------------------------

#[test]
fn test_season_transition_snapshot_paused() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &2, &120, &4200, &900_000, &true,
        &3000, &20, &950_000, &false,
    );

    let snap = client.season_transition_snapshot(&2);
    assert!(snap.exists);
    assert!(snap.was_paused);
}

// ---------------------------------------------------------------------------
// season_transition_snapshot — missing season returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_season_transition_snapshot_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let snap = client.season_transition_snapshot(&99);
    assert!(!snap.exists);
    assert_eq!(snap.season_id, 99);
    assert_eq!(snap.ended_at_ledger, 0);
    assert_eq!(snap.total_participants, 0);
    assert_eq!(snap.top_score, 0);
    assert!(!snap.was_paused);
}

// ---------------------------------------------------------------------------
// demotion_cutoff — success path
// ---------------------------------------------------------------------------

#[test]
fn test_demotion_cutoff_success() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &3, &300, &8000, &2_000_000, &false,
        &5000, &100, &2_100_000, &true,
    );

    let cutoff = client.demotion_cutoff(&3);
    assert!(cutoff.exists);
    assert_eq!(cutoff.season_id, 3);
    assert_eq!(cutoff.cutoff_score, 5000);
    assert_eq!(cutoff.cutoff_rank, 100);
    assert_eq!(cutoff.demotion_window_end, 2_100_000);
    assert!(cutoff.window_active);
}

// ---------------------------------------------------------------------------
// demotion_cutoff — window closed
// ---------------------------------------------------------------------------

#[test]
fn test_demotion_cutoff_window_closed() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &4, &200, &6000, &1_500_000, &false,
        &4000, &80, &1_600_000, &false,
    );

    let cutoff = client.demotion_cutoff(&4);
    assert!(cutoff.exists);
    assert!(!cutoff.window_active);
}

// ---------------------------------------------------------------------------
// demotion_cutoff — missing season returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_demotion_cutoff_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let cutoff = client.demotion_cutoff(&999);
    assert!(!cutoff.exists);
    assert_eq!(cutoff.season_id, 999);
    assert_eq!(cutoff.cutoff_score, 0);
    assert_eq!(cutoff.cutoff_rank, 0);
    assert_eq!(cutoff.demotion_window_end, 0);
    assert!(!cutoff.window_active);
}
