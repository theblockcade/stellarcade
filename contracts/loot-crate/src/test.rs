use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup_client(env: &Env) -> (LootCrateClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register_contract(None, LootCrate);
    let client = LootCrateClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin)
}

#[test]
fn test_availability_and_rarity_distribution_happy_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup_client(&env);

    client.upsert_crate(&admin, &7, &100, &25, &false, &60, &25, &10, &5);

    let availability = client.crate_availability_snapshot(&7);
    assert!(availability.exists);
    assert_eq!(availability.state, CrateAvailabilityState::Available);
    assert_eq!(availability.remaining_supply, 75);

    let rarity = client.rarity_distribution_snapshot(&7);
    assert!(rarity.exists);
    assert_eq!(rarity.common_bps, 6_000);
    assert_eq!(rarity.legendary_bps, 500);
}

#[test]
fn test_missing_crate_returns_empty_snapshot() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin) = setup_client(&env);

    let availability = client.crate_availability_snapshot(&404);
    assert!(!availability.exists);
    assert_eq!(availability.state, CrateAvailabilityState::Missing);

    let rarity = client.rarity_distribution_snapshot(&404);
    assert!(!rarity.exists);
    assert_eq!(rarity.common_bps, 0);
}

// ── contents_availability_snapshot ──────────────────────────────────────────

#[test]
fn test_contents_availability_snapshot_openable() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup_client(&env);
    // 60 common + 25 rare + 10 epic + 5 legendary = 100 total items
    client.upsert_crate(&admin, &1, &100, &20, &false, &60, &25, &10, &5);

    let snap = client.contents_availability_snapshot(&1);
    assert!(snap.exists);
    assert!(snap.openable);
    assert_eq!(snap.state, CrateAvailabilityState::Available);
    assert_eq!(snap.remaining_supply, 80);
    assert_eq!(snap.common_bps, 6_000);
    assert_eq!(snap.legendary_bps, 500);
}

#[test]
fn test_contents_availability_snapshot_paused() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup_client(&env);
    client.upsert_crate(&admin, &2, &100, &0, &true, &50, &50, &0, &0);

    let snap = client.contents_availability_snapshot(&2);
    assert!(snap.exists);
    assert!(!snap.openable);
    assert_eq!(snap.state, CrateAvailabilityState::Paused);
}

#[test]
fn test_contents_availability_snapshot_sold_out() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup_client(&env);
    client.upsert_crate(&admin, &3, &50, &50, &false, &50, &50, &0, &0);

    let snap = client.contents_availability_snapshot(&3);
    assert!(snap.exists);
    assert!(!snap.openable);
    assert_eq!(snap.state, CrateAvailabilityState::SoldOut);
    assert_eq!(snap.remaining_supply, 0);
}

#[test]
fn test_contents_availability_snapshot_missing() {
    let env = Env::default();
    let (client, _admin) = setup_client(&env);

    let snap = client.contents_availability_snapshot(&999);
    assert!(!snap.exists);
    assert!(!snap.openable);
    assert_eq!(snap.state, CrateAvailabilityState::Missing);
    assert_eq!(snap.common_bps, 0);
}

// ── open_cooldown_accessor ───────────────────────────────────────────────────

#[test]
fn test_open_cooldown_accessor_ready_when_no_cooldown() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(5000);
    let (client, admin) = setup_client(&env);
    client.upsert_crate(&admin, &10, &100, &0, &false, &100, &0, &0, &0);

    let acc = client.open_cooldown_accessor(&10, &4000u64, &0u64);
    assert!(acc.ready);
    assert!(acc.openable);
}

#[test]
fn test_open_cooldown_accessor_within_cooldown() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(5000);
    let (client, admin) = setup_client(&env);
    client.upsert_crate(&admin, &11, &100, &0, &false, &100, &0, &0, &0);

    // last_opened_at=4800, cooldown=300 → expires_at=5100; now=5000 is inside cooldown
    let acc = client.open_cooldown_accessor(&11, &4800u64, &300u64);
    assert!(!acc.ready);
    assert_eq!(acc.cooldown_expires_at, 5100);
}

#[test]
fn test_open_cooldown_accessor_past_cooldown() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(5500);
    let (client, admin) = setup_client(&env);
    client.upsert_crate(&admin, &12, &100, &0, &false, &100, &0, &0, &0);

    // cooldown expired: 4800 + 300 = 5100 < 5500
    let acc = client.open_cooldown_accessor(&12, &4800u64, &300u64);
    assert!(acc.ready);
}

#[test]
fn test_open_cooldown_accessor_missing_crate() {
    let env = Env::default();
    let (client, _admin) = setup_client(&env);

    let acc = client.open_cooldown_accessor(&999, &0u64, &100u64);
    assert!(!acc.ready);
    assert!(!acc.exists);
}
