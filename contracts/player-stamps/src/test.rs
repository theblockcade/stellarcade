#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Address, Env};

fn setup<'a>() -> (Env, Address, PlayerStampsClient<'a>) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let contract_id = env.register(PlayerStamps, ());
    let client = PlayerStampsClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.init(&admin);
    (env, admin, client)
}

#[test]
fn stamp_progress_summary_reports_completion() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);
    client.upsert_campaign(&admin, &7u32, &3u32, &1_500u64, &false);
    client.add_stamps(&admin, &player, &7u32, &2u32);

    let partial = client.stamp_progress_summary(&player, &7u32);
    assert_eq!(partial.exists, true);
    assert_eq!(partial.earned_stamps, 2);
    assert_eq!(partial.remaining_stamps, 1);
    assert_eq!(partial.completed, false);

    client.add_stamps(&admin, &player, &7u32, &1u32);
    let completed = client.stamp_progress_summary(&player, &7u32);
    assert_eq!(completed.completed, true);
    assert_eq!(completed.remaining_stamps, 0);
}

#[test]
fn claim_window_accessor_tracks_claimability_and_claimed_state() {
    let (env, admin, client) = setup();
    let player = Address::generate(&env);
    client.upsert_campaign(&admin, &9u32, &2u32, &2_000u64, &false);
    client.add_stamps(&admin, &player, &9u32, &2u32);

    let before = client.claim_window_accessor(&player, &9u32);
    assert_eq!(before.state, StampClaimState::InProgress);
    assert_eq!(before.seconds_until_claimable, 1_000);

    env.ledger().set_timestamp(2_000);
    let open = client.claim_window_accessor(&player, &9u32);
    assert_eq!(open.state, StampClaimState::Claimable);

    client.claim(&player, &9u32);
    let claimed = client.claim_window_accessor(&player, &9u32);
    assert_eq!(claimed.state, StampClaimState::Claimed);
}

#[test]
fn missing_campaign_returns_predictable_defaults() {
    let (env, _admin, client) = setup();
    let player = Address::generate(&env);

    let summary = client.stamp_progress_summary(&player, &404u32);
    assert_eq!(summary.exists, false);
    assert_eq!(summary.configured, true);

    let window = client.claim_window_accessor(&player, &404u32);
    assert_eq!(window.exists, false);
    assert_eq!(window.state, StampClaimState::Unknown);
}
