#![cfg(test)]

use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, testutils::LedgerInfo, Address, Env};

use super::*;

fn setup(env: &Env) -> (MissionPassClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register(MissionPass, ());
    let client = MissionPassClient::new(env, &contract_id);
    env.mock_all_auths();
    client.init(&admin);
    (client, admin)
}

// ---------------------------------------------------------------------------
// pass_progress_snapshot — success path
// ---------------------------------------------------------------------------

#[test]
fn test_pass_progress_snapshot_success() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    // 6 of 10 missions done → 60 %
    client.upsert_pass(&admin, &1, &10, &6, &8);

    let snap = client.pass_progress_snapshot(&1);
    assert!(snap.exists);
    assert_eq!(snap.pass_id, 1);
    assert_eq!(snap.total_missions, 10);
    assert_eq!(snap.completed_missions, 6);
    assert_eq!(snap.completion_pct, 60);
    assert!(!snap.is_complete);
}

// ---------------------------------------------------------------------------
// pass_progress_snapshot — fully completed pass
// ---------------------------------------------------------------------------

#[test]
fn test_pass_progress_snapshot_complete() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_pass(&admin, &2, &5, &5, &5);

    let snap = client.pass_progress_snapshot(&2);
    assert!(snap.exists);
    assert!(snap.is_complete);
    assert_eq!(snap.completion_pct, 100);
}

// ---------------------------------------------------------------------------
// pass_progress_snapshot — missing pass returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_pass_progress_snapshot_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let snap = client.pass_progress_snapshot(&99);
    assert!(!snap.exists);
    assert_eq!(snap.pass_id, 99);
    assert_eq!(snap.total_missions, 0);
    assert_eq!(snap.completed_missions, 0);
    assert_eq!(snap.completion_pct, 0);
    assert!(!snap.is_complete);
}

// ---------------------------------------------------------------------------
// unlock_gap — still locked
// ---------------------------------------------------------------------------

#[test]
fn test_unlock_gap_locked() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    // completed=3, threshold=8 → gap=5, locked
    client.upsert_pass(&admin, &3, &10, &3, &8);

    let gap = client.unlock_gap(&3);
    assert!(gap.exists);
    assert_eq!(gap.pass_id, 3);
    assert_eq!(gap.current_progress, 3);
    assert_eq!(gap.next_unlock_threshold, 8);
    assert_eq!(gap.missions_to_next_unlock, 5);
    assert!(gap.locked);
}

// ---------------------------------------------------------------------------
// unlock_gap — threshold reached (unlocked)
// ---------------------------------------------------------------------------

#[test]
fn test_unlock_gap_unlocked() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    // completed=8, threshold=8 → gap=0, not locked
    client.upsert_pass(&admin, &4, &10, &8, &8);

    let gap = client.unlock_gap(&4);
    assert!(gap.exists);
    assert_eq!(gap.missions_to_next_unlock, 0);
    assert!(!gap.locked);
}

// ---------------------------------------------------------------------------
// unlock_gap — missing pass returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_unlock_gap_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let gap = client.unlock_gap(&999);
    assert!(!gap.exists);
    assert_eq!(gap.pass_id, 999);
    assert_eq!(gap.missions_to_next_unlock, 0);
    assert_eq!(gap.next_unlock_threshold, 0);
    assert_eq!(gap.current_progress, 0);
    assert!(!gap.locked);
}

// ---------------------------------------------------------------------------
// season_expiry and pass_tier_snapshot tests
// ---------------------------------------------------------------------------

#[test]
fn test_season_expiry_getter_setter() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    assert_eq!(client.season_expiry(), 0);

    client.set_season_expiry(&admin, &500_000);
    assert_eq!(client.season_expiry(), 500_000);
}

#[test]
fn test_pass_tier_snapshot() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.set_season_expiry(&admin, &100);

    // Test missing pass
    let snap_missing = client.pass_tier_snapshot(&99);
    assert!(!snap_missing.exists);
    assert_eq!(snap_missing.season_expiry, 100);
    assert!(!snap_missing.is_expired);

    // Test existing pass
    client.upsert_pass(&admin, &5, &12, &3, &6);
    
    // Not expired yet (ledger=0)
    let snap = client.pass_tier_snapshot(&5);
    assert!(snap.exists);
    assert_eq!(snap.pass_id, 5);
    assert_eq!(snap.total_missions, 12);
    assert_eq!(snap.next_unlock_threshold, 6);
    assert_eq!(snap.season_expiry, 100);
    assert!(!snap.is_expired);

    // Move ledger sequence past expiry
    env.ledger().set(LedgerInfo {
        protocol_version: 22,
        sequence_number: 150,
        timestamp: 0,
        network_id: [0; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 0,
    });

    let snap_expired = client.pass_tier_snapshot(&5);
    assert!(snap_expired.is_expired);
}
