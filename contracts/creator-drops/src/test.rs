#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(env: &Env) -> (CreatorDropsClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let creator = Address::generate(env);
    let contract_id = env.register(CreatorDrops, ());
    let client = CreatorDropsClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, creator)
}

#[test]
fn window_snapshot_and_saturation_track_claims() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 150);

    let (client, admin, creator) = setup(&env);
    let claimer = Address::generate(&env);

    client.upsert_drop(
        &admin,
        &11,
        &DropConfigInput {
            creator: creator.clone(),
            starts_at: 100,
            ends_at: 300,
            total_supply: 10,
            paused: false,
        },
    );
    client.claim(&claimer, &11, &3);

    let snapshot = client.drop_window_snapshot(&11);
    assert!(snapshot.exists);
    assert_eq!(snapshot.state, DropWindowState::Open);
    assert_eq!(snapshot.creator, Some(creator));
    assert_eq!(snapshot.claimed_supply, 3);
    assert_eq!(snapshot.remaining_supply, 7);
    assert_eq!(snapshot.claim_count, 1);
    assert!(snapshot.can_claim);

    let saturation = client.claim_saturation(&11);
    assert_eq!(saturation.saturation_bps, 3_000);
    assert_eq!(saturation.remaining_supply, 7);
    assert!(saturation.can_claim);
}

#[test]
fn not_configured_and_missing_drop_reads_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CreatorDrops, ());
    let client = CreatorDropsClient::new(&env, &contract_id);

    let before_init = client.drop_window_snapshot(&77);
    assert!(!before_init.configured);
    assert_eq!(before_init.state, DropWindowState::NotConfigured);
    assert_eq!(before_init.creator, None);

    let admin = Address::generate(&env);
    client.init(&admin);

    let missing = client.claim_saturation(&77);
    assert!(missing.configured);
    assert!(!missing.exists);
    assert_eq!(missing.saturation_bps, 0);
    assert!(!missing.can_claim);
}

// ── drop_allocation_snapshot ──────────────────────────────────────────────────

#[test]
fn allocation_snapshot_reflects_claimed_and_remaining() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 150);

    let (client, admin, creator) = setup(&env);
    let claimer = Address::generate(&env);

    client.upsert_drop(
        &admin,
        &20,
        &DropConfigInput {
            creator,
            starts_at: 100,
            ends_at: 300,
            total_supply: 20,
            paused: false,
        },
    );
    client.claim(&claimer, &20, &5);

    let snap = client.drop_allocation_snapshot(&20);
    assert!(snap.configured);
    assert!(snap.exists);
    assert_eq!(snap.total_supply, 20);
    assert_eq!(snap.claimed_supply, 5);
    assert_eq!(snap.remaining_supply, 15);
    assert_eq!(snap.claimed_bps, 2_500);
    assert_eq!(snap.remaining_bps, 7_500);
    assert!(!snap.is_fully_allocated);
}

#[test]
fn allocation_snapshot_missing_drop_returns_zeroed() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _creator) = setup(&env);

    let snap = client.drop_allocation_snapshot(&999);
    assert!(snap.configured);
    assert!(!snap.exists);
    assert_eq!(snap.total_supply, 0);
    assert_eq!(snap.claimed_bps, 0);
    assert_eq!(snap.remaining_bps, 0);
    assert!(!snap.is_fully_allocated);
}

// ── claim_window_accessor ─────────────────────────────────────────────────────

#[test]
fn claim_window_accessor_open_drop_not_in_window() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 150);

    let (client, admin, creator) = setup(&env);

    client.upsert_drop(
        &admin,
        &30,
        &DropConfigInput {
            creator,
            starts_at: 100,
            ends_at: 300,
            total_supply: 10,
            paused: false,
        },
    );

    // Drop is still open; not yet in post-close window
    let window = client.claim_window_accessor(&30, &3600u64);
    assert!(window.exists);
    assert_eq!(window.state, DropWindowState::Open);
    assert!(window.can_claim);
    assert!(!window.in_claim_window);
    assert_eq!(window.claim_window_end, 300 + 3600);
}

#[test]
fn claim_window_accessor_after_close_enters_window() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 400);

    let (client, admin, creator) = setup(&env);

    client.upsert_drop(
        &admin,
        &31,
        &DropConfigInput {
            creator,
            starts_at: 100,
            ends_at: 300,
            total_supply: 10,
            paused: false,
        },
    );

    // now=400, ends_at=300, claim_window_secs=200 → window_end=500
    let window = client.claim_window_accessor(&31, &200u64);
    assert!(window.exists);
    assert!(window.in_claim_window);
    assert_eq!(window.secs_until_window_end, 100); // 500 - 400
    assert!(!window.can_claim); // drop is closed, not open
}

#[test]
fn claim_window_accessor_missing_returns_zeroed() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _creator) = setup(&env);

    let window = client.claim_window_accessor(&999, &3600u64);
    assert!(window.configured);
    assert!(!window.exists);
    assert!(!window.in_claim_window);
    assert_eq!(window.secs_until_window_end, 0);
}
