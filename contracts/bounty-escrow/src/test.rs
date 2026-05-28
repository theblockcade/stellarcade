#![cfg(test)]

use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{symbol_short, Address, Env, Symbol};

use crate::types::{BountyStatus, OptionalBountyStatus};
use crate::{BountyEscrow, BountyEscrowClient};

// ── Helpers ───────────────────────────────────────────────────────────────────

fn setup() -> (Env, BountyEscrowClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(BountyEscrow, ());
    let client = BountyEscrowClient::new(&env, &contract_id);
    (env, client)
}

fn setup_initialized() -> (Env, BountyEscrowClient<'static>, Address, Address) {
    let (env, client) = setup();
    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    client.init(&admin, &token, &100u32);
    (env, client, admin, token)
}

/// Set ledger sequence so expiry_ledger can be in the future, then post a bounty.
fn post_bounty(
    env: &Env,
    client: &BountyEscrowClient,
    poster: &Address,
    reward: i128,
    description: Symbol,
) -> u64 {
    env.ledger().set_sequence_number(100);
    client.post_bounty(poster, &reward, &200u32, &description)
}

// ── Task 7.1: test_get_bounty_success ─────────────────────────────────────────
// Property 1: get_bounty round-trip consistency
// Validates: Requirements 1.1

#[test]
fn test_get_bounty_success() {
    let (env, client, _, _) = setup_initialized();
    let poster = Address::generate(&env);
    let description = symbol_short!("work");
    let reward: i128 = 500;

    let bounty_id = post_bounty(&env, &client, &poster, reward, description.clone());

    let view = client.get_bounty(&bounty_id);

    assert!(view.exists);
    assert_eq!(view.bounty_id, bounty_id);
    assert_eq!(view.poster, Some(poster));
    assert_eq!(view.reward, Some(reward));
    assert_eq!(view.status, OptionalBountyStatus::Some(BountyStatus::Open));
    assert_eq!(view.expiry_ledger, Some(200u32));
    assert_eq!(view.description, Some(description));
}

// ── Task 7.3: test_get_bounty_missing ─────────────────────────────────────────
// Property 2: get_bounty missing-ID zero-state
// Validates: Requirements 1.2, 7.1

#[test]
fn test_get_bounty_missing() {
    let (_env, client) = setup();

    let view = client.get_bounty(&9999u64);

    assert!(!view.exists);
    assert_eq!(view.bounty_id, 9999u64);
    assert_eq!(view.poster, None);
    assert_eq!(view.reward, None);
    assert_eq!(view.status, OptionalBountyStatus::None);
    assert_eq!(view.expiry_ledger, None);
    assert_eq!(view.description, None);
}

// ── Task 7.4: test_get_bounties_by_poster_success ─────────────────────────────
// Property 3: get_bounties_by_poster completeness
// Validates: Requirements 2.1, 2.4

#[test]
fn test_get_bounties_by_poster_success() {
    let (env, client, _, _) = setup_initialized();
    let poster = Address::generate(&env);

    let id1 = post_bounty(&env, &client, &poster, 100, symbol_short!("task1"));
    let id2 = post_bounty(&env, &client, &poster, 200, symbol_short!("task2"));

    let views = client.get_bounties_by_poster(&poster);

    assert_eq!(views.len(), 2);

    // Both entries should have the correct poster
    for view in views.iter() {
        assert!(view.exists);
        assert_eq!(view.poster, Some(poster.clone()));
    }

    // Both IDs should be present
    let returned_ids: [u64; 2] = [views.get(0).unwrap().bounty_id, views.get(1).unwrap().bounty_id];
    assert!(returned_ids.contains(&id1));
    assert!(returned_ids.contains(&id2));
}

// ── Task 7.6: test_get_bounty_status_success ──────────────────────────────────
// Property 4: get_bounty_status consistency with get_bounty
// Validates: Requirements 3.1

#[test]
fn test_get_bounty_status_success() {
    let (env, client, _, _) = setup_initialized();
    let poster = Address::generate(&env);

    let bounty_id = post_bounty(&env, &client, &poster, 300, symbol_short!("status"));

    let status_view = client.get_bounty_status(&bounty_id);
    let full_view = client.get_bounty(&bounty_id);

    assert!(status_view.exists);
    assert_eq!(status_view.bounty_id, bounty_id);
    // Status must match what get_bounty returns
    assert_eq!(status_view.status, full_view.status);
    assert_eq!(status_view.status, OptionalBountyStatus::Some(BountyStatus::Open));
}

// ── Task 7.8: test_get_platform_config_initialized ────────────────────────────
// Property 5: get_platform_config round-trip
// Validates: Requirements 4.1

#[test]
fn test_get_platform_config_initialized() {
    let (env, client) = setup();
    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let fee_bps: u32 = 250;

    client.init(&admin, &token, &fee_bps);

    let config = client.get_platform_config();

    assert!(config.initialized);
    assert_eq!(config.admin, Some(admin));
    assert_eq!(config.token, Some(token));
    assert_eq!(config.fee_bps, Some(fee_bps));
}

// ── Task 7.9: test_get_platform_config_uninitialized ──────────────────────────
// Validates: Requirements 4.2, 7.2

#[test]
fn test_get_platform_config_uninitialized() {
    let (_env, client) = setup();

    let config = client.get_platform_config();

    assert!(!config.initialized);
    assert_eq!(config.admin, None);
    assert_eq!(config.token, None);
    assert_eq!(config.fee_bps, None);
}

// ── Task 7.10: test_get_bounty_summary_empty ──────────────────────────────────
// Validates: Requirements 5.1

#[test]
fn test_get_bounty_summary_empty() {
    let (_env, client) = setup();

    let summary = client.get_bounty_summary();

    assert_eq!(summary.open_count, 0);
    assert_eq!(summary.paused_count, 0);
    assert_eq!(summary.completed_count, 0);
    assert_eq!(summary.cancelled_count, 0);
    assert_eq!(summary.total_escrowed, 0);
}

// ── Task 7.11: test_get_bounty_summary_mixed_states ───────────────────────────
// Property 6: get_bounty_summary count invariant
// Property 7: get_bounty_summary total_escrowed invariant
// Validates: Requirements 5.2, 5.3

#[test]
fn test_get_bounty_summary_mixed_states() {
    let (env, client, admin, _) = setup_initialized();
    let poster = Address::generate(&env);

    // Post four bounties with distinct rewards
    let reward_open: i128 = 100;
    let reward_paused: i128 = 200;
    let reward_completed: i128 = 300;
    let reward_cancelled: i128 = 400;

    let _id_open = post_bounty(&env, &client, &poster, reward_open, symbol_short!("open"));
    let id_paused = post_bounty(&env, &client, &poster, reward_paused, symbol_short!("paused"));
    let id_completed = post_bounty(&env, &client, &poster, reward_completed, symbol_short!("done"));
    let id_cancelled = post_bounty(&env, &client, &poster, reward_cancelled, symbol_short!("cancel"));

    // Transition statuses (id_open stays Open)
    client.update_bounty_status(&admin, &id_paused, &BountyStatus::Paused);
    client.update_bounty_status(&admin, &id_completed, &BountyStatus::Completed);
    client.update_bounty_status(&admin, &id_cancelled, &BountyStatus::Cancelled);

    let summary = client.get_bounty_summary();

    // Count invariant: all four statuses each have exactly 1
    assert_eq!(summary.open_count, 1);
    assert_eq!(summary.paused_count, 1);
    assert_eq!(summary.completed_count, 1);
    assert_eq!(summary.cancelled_count, 1);

    // total_escrowed = Open + Paused rewards only
    let expected_escrowed = reward_open + reward_paused;
    assert_eq!(summary.total_escrowed, expected_escrowed);
}
