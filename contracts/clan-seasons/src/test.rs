#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use super::*;

fn setup(env: &Env) -> (ClanSeasonsClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register(ClanSeasons, ());
    let client = ClanSeasonsClient::new(env, &contract_id);
    env.mock_all_auths();
    client.init(&admin);
    (client, admin)
}

// ---------------------------------------------------------------------------
// season_carryover_snapshot — success path
// ---------------------------------------------------------------------------

#[test]
fn test_season_carryover_snapshot_success() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &1, &5000, &12, &2_000_000, &true,
        &1_900_000, &true, &25, &1,
    );

    let snap = client.season_carryover_snapshot(&1);
    assert!(snap.exists);
    assert_eq!(snap.season_id, 1);
    assert_eq!(snap.carryover_xp, 5000);
    assert_eq!(snap.carryover_rank, 12);
    assert_eq!(snap.season_end_ledger, 2_000_000);
    assert!(snap.was_locked);
}

// ---------------------------------------------------------------------------
// season_carryover_snapshot — unlocked season
// ---------------------------------------------------------------------------

#[test]
fn test_season_carryover_snapshot_unlocked() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &2, &1200, &5, &1_500_000, &false,
        &0, &false, &0, &0,
    );

    let snap = client.season_carryover_snapshot(&2);
    assert!(snap.exists);
    assert!(!snap.was_locked);
}

// ---------------------------------------------------------------------------
// season_carryover_snapshot — missing season returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_season_carryover_snapshot_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let snap = client.season_carryover_snapshot(&99);
    assert!(!snap.exists);
    assert_eq!(snap.season_id, 99);
    assert_eq!(snap.carryover_xp, 0);
    assert_eq!(snap.carryover_rank, 0);
    assert_eq!(snap.season_end_ledger, 0);
    assert!(!snap.was_locked);
}

// ---------------------------------------------------------------------------
// roster_lock — locked by season-end
// ---------------------------------------------------------------------------

#[test]
fn test_roster_lock_season_end() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &3, &3000, &8, &1_800_000, &true,
        &1_750_000, &true, &30, &1,
    );

    let lock = client.roster_lock(&3);
    assert!(lock.exists);
    assert_eq!(lock.season_id, 3);
    assert_eq!(lock.lock_ledger, 1_750_000);
    assert!(lock.is_locked);
    assert_eq!(lock.locked_member_count, 30);
    assert_eq!(lock.lock_reason_code, 1);
}

// ---------------------------------------------------------------------------
// roster_lock — locked by admin
// ---------------------------------------------------------------------------

#[test]
fn test_roster_lock_admin() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &4, &800, &3, &1_200_000, &true,
        &1_100_000, &true, &10, &2,
    );

    let lock = client.roster_lock(&4);
    assert!(lock.exists);
    assert!(lock.is_locked);
    assert_eq!(lock.lock_reason_code, 2);
}

// ---------------------------------------------------------------------------
// roster_lock — not locked
// ---------------------------------------------------------------------------

#[test]
fn test_roster_lock_not_locked() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &5, &200, &1, &900_000, &false,
        &0, &false, &0, &0,
    );

    let lock = client.roster_lock(&5);
    assert!(lock.exists);
    assert!(!lock.is_locked);
    assert_eq!(lock.lock_reason_code, 0);
    assert_eq!(lock.locked_member_count, 0);
}

// ---------------------------------------------------------------------------
// roster_lock — missing season returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_roster_lock_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let lock = client.roster_lock(&999);
    assert!(!lock.exists);
    assert_eq!(lock.season_id, 999);
    assert_eq!(lock.lock_ledger, 0);
    assert!(!lock.is_locked);
    assert_eq!(lock.locked_member_count, 0);
    assert_eq!(lock.lock_reason_code, 0);
}

// ---------------------------------------------------------------------------
// participation_summary — known season
// ---------------------------------------------------------------------------

#[test]
fn test_participation_summary_known_season() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &10, &4000, &7, &3_000_000, &true,
        &2_900_000, &true, &20, &1,
    );

    let summary = client.participation_summary(&10);
    assert!(summary.exists);
    assert_eq!(summary.season_id, 10);
    assert_eq!(summary.locked_member_count, 20);
    assert!(summary.was_locked);
    assert_eq!(summary.carryover_xp, 4000);
    assert_eq!(summary.carryover_rank, 7);
}

// ---------------------------------------------------------------------------
// participation_summary — unknown season returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_participation_summary_unknown_season() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let summary = client.participation_summary(&42);
    assert!(!summary.exists);
    assert_eq!(summary.season_id, 42);
    assert_eq!(summary.locked_member_count, 0);
    assert!(!summary.was_locked);
    assert_eq!(summary.carryover_xp, 0);
    assert_eq!(summary.carryover_rank, 0);
}

// ---------------------------------------------------------------------------
// transition_gap — two configured seasons
// ---------------------------------------------------------------------------

#[test]
fn test_transition_gap_two_known_seasons() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    // from season ends at ledger 2_000_000
    client.upsert_season(
        &admin, &20, &1000, &5, &2_000_000, &false,
        &0, &false, &0, &0,
    );
    // to season proxy-start (season_end_ledger) = 1_800_000
    client.upsert_season(
        &admin, &21, &2000, &6, &1_800_000, &false,
        &0, &false, &0, &0,
    );

    let gap = client.transition_gap(&20, &21);
    assert!(gap.from_exists);
    assert!(gap.to_exists);
    assert_eq!(gap.from_end_ledger, 2_000_000);
    assert_eq!(gap.to_start_ledger, 1_800_000);
    assert_eq!(gap.gap_ledgers, 200_000);
}

// ---------------------------------------------------------------------------
// transition_gap — missing season handled gracefully
// ---------------------------------------------------------------------------

#[test]
fn test_transition_gap_missing_season() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_season(
        &admin, &30, &500, &2, &1_500_000, &false,
        &0, &false, &0, &0,
    );

    let gap = client.transition_gap(&30, &999);
    assert!(gap.from_exists);
    assert!(!gap.to_exists);
    assert_eq!(gap.gap_ledgers, 0);
}
