#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use super::*;

fn setup(env: &Env) -> (ArenaLadderClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register(ArenaLadder, ());
    let client = ArenaLadderClient::new(env, &contract_id);
    env.mock_all_auths();
    client.init(&admin);
    (client, admin)
}

// ---------------------------------------------------------------------------
// bracket_pressure_snapshot — success path
// ---------------------------------------------------------------------------

#[test]
fn test_bracket_pressure_snapshot_success() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    // 32 players, threshold=8, pressure=750 → not critical
    client.upsert_bracket(
        &admin, &1, &32, &8, &750, &1_000_000, &1_100_000, &10, &true,
    );

    let snap = client.bracket_pressure_snapshot(&1);
    assert!(snap.exists);
    assert_eq!(snap.bracket_id, 1);
    assert_eq!(snap.players_in_bracket, 32);
    assert_eq!(snap.elimination_threshold, 8);
    assert_eq!(snap.pressure_score, 750);
    assert!(!snap.is_critical);
}

// ---------------------------------------------------------------------------
// bracket_pressure_snapshot — critical bracket
// ---------------------------------------------------------------------------

#[test]
fn test_bracket_pressure_snapshot_critical() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    // 4 players, threshold=8 → critical (4 <= 8)
    client.upsert_bracket(
        &admin, &2, &4, &8, &1200, &900_000, &950_000, &5, &true,
    );

    let snap = client.bracket_pressure_snapshot(&2);
    assert!(snap.exists);
    assert!(snap.is_critical);
}

// ---------------------------------------------------------------------------
// bracket_pressure_snapshot — missing bracket returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_bracket_pressure_snapshot_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let snap = client.bracket_pressure_snapshot(&99);
    assert!(!snap.exists);
    assert_eq!(snap.bracket_id, 99);
    assert_eq!(snap.players_in_bracket, 0);
    assert_eq!(snap.elimination_threshold, 0);
    assert_eq!(snap.pressure_score, 0);
    assert!(!snap.is_critical);
}

// ---------------------------------------------------------------------------
// promotion_window — window open
// ---------------------------------------------------------------------------

#[test]
fn test_promotion_window_open() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_bracket(
        &admin, &3, &16, &4, &500, &1_000_000, &1_200_000, &5, &true,
    );

    let window = client.promotion_window(&3);
    assert!(window.exists);
    assert_eq!(window.bracket_id, 3);
    assert_eq!(window.window_open_ledger, 1_000_000);
    assert_eq!(window.window_close_ledger, 1_200_000);
    assert_eq!(window.min_rank_for_promotion, 5);
    assert!(window.window_active);
}

// ---------------------------------------------------------------------------
// promotion_window — window closed
// ---------------------------------------------------------------------------

#[test]
fn test_promotion_window_closed() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_bracket(
        &admin, &4, &8, &4, &300, &800_000, &900_000, &3, &false,
    );

    let window = client.promotion_window(&4);
    assert!(window.exists);
    assert!(!window.window_active);
}

// ---------------------------------------------------------------------------
// promotion_window — missing bracket returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_promotion_window_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let window = client.promotion_window(&999);
    assert!(!window.exists);
    assert_eq!(window.bracket_id, 999);
    assert_eq!(window.window_open_ledger, 0);
    assert_eq!(window.window_close_ledger, 0);
    assert_eq!(window.min_rank_for_promotion, 0);
    assert!(!window.window_active);
}

// ---------------------------------------------------------------------------
// arena_ranking_summary — with brackets
// ---------------------------------------------------------------------------

#[test]
fn test_arena_ranking_summary() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_bracket(
        &admin, &1, &32, &8, &750, &1_000_000, &1_100_000, &10, &true,
    );
    client.upsert_bracket(
        &admin, &2, &4, &8, &1200, &900_000, &950_000, &5, &false,
    );

    let summary = client.arena_ranking_summary();
    assert_eq!(summary.total_brackets, 2);
    assert_eq!(summary.total_players, 36);
    assert_eq!(summary.active_promotions, 1);
    assert_eq!(summary.critical_brackets, 1);
}

// ---------------------------------------------------------------------------
// arena_ranking_summary — empty state
// ---------------------------------------------------------------------------

#[test]
fn test_arena_ranking_summary_empty() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let summary = client.arena_ranking_summary();
    assert_eq!(summary.total_brackets, 0);
    assert_eq!(summary.total_players, 0);
    assert_eq!(summary.active_promotions, 0);
    assert_eq!(summary.average_pressure_score, 0);
    assert_eq!(summary.critical_brackets, 0);
}

// ---------------------------------------------------------------------------
// season_cutoff_accessor — active season
// ---------------------------------------------------------------------------

#[test]
fn test_season_cutoff_accessor_active() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    let current_ledger = env.ledger().sequence() as u32;
    let cutoff_ledger = current_ledger + 1000;
    client.set_season_cutoff(&admin, &1, &cutoff_ledger).unwrap();

    let accessor = client.season_cutoff_accessor(&1);
    assert_eq!(accessor.season_id, 1);
    assert_eq!(accessor.cutoff_ledger, cutoff_ledger);
    assert!(accessor.is_season_active);
    assert!(accessor.ledgers_until_cutoff > 0);
}

// ---------------------------------------------------------------------------
// season_cutoff_accessor — expired season
// ---------------------------------------------------------------------------

#[test]
fn test_season_cutoff_accessor_expired() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    let current_ledger = env.ledger().sequence() as u32;
    let cutoff_ledger = current_ledger - 10;
    client.set_season_cutoff(&admin, &2, &cutoff_ledger).unwrap();

    let accessor = client.season_cutoff_accessor(&2);
    assert!(!accessor.is_season_active);
    assert_eq!(accessor.ledgers_until_cutoff, 0);
}

// ---------------------------------------------------------------------------
// season_cutoff_accessor — missing season
// ---------------------------------------------------------------------------

#[test]
fn test_season_cutoff_accessor_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let accessor = client.season_cutoff_accessor(&999);
    assert_eq!(accessor.season_id, 999);
    assert_eq!(accessor.cutoff_ledger, 0);
    assert!(!accessor.is_season_active);
    assert_eq!(accessor.ledgers_until_cutoff, 0);
}
