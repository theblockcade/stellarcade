#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::Env;

fn setup() -> (Env, MissionCheckinsClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, MissionCheckins);
    let client = MissionCheckinsClient::new(&env, &contract_id);
    (env, client)
}

#[test]
fn counts_checkins_and_unique_participants() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.configure_mission(&1, &1_000);
    client.check_in(&1, &alice);
    client.check_in(&1, &alice); // repeat -> not a new unique participant
    client.check_in(&1, &bob);

    let summary = client.participation_summary(&1);
    assert!(summary.mission_exists);
    assert_eq!(summary.total_checkins, 3);
    assert_eq!(summary.unique_participants, 2);
}

#[test]
fn window_resets_counts_after_interval() {
    let (env, client) = setup();
    let alice = Address::generate(&env);

    client.configure_mission(&1, &1_000);
    client.check_in(&1, &alice);
    assert_eq!(client.participation_summary(&1).total_checkins, 1);

    // Advance beyond the reset interval; the next check-in starts a new window.
    env.ledger().with_mut(|li| li.timestamp = 2_000);
    client.check_in(&1, &alice);

    let summary = client.participation_summary(&1);
    assert_eq!(summary.total_checkins, 1);
    assert_eq!(summary.unique_participants, 1);
}

#[test]
fn reset_window_reports_time_remaining() {
    let (env, client) = setup();
    client.configure_mission(&1, &1_000); // window_start = 0

    env.ledger().with_mut(|li| li.timestamp = 400);
    let window = client.reset_window(&1);
    assert!(window.mission_exists);
    assert_eq!(window.next_reset, 1_000);
    assert_eq!(window.seconds_until_reset, 600);
    assert!(!window.window_elapsed);

    env.ledger().with_mut(|li| li.timestamp = 1_200);
    let elapsed = client.reset_window(&1);
    assert!(elapsed.window_elapsed);
    assert_eq!(elapsed.seconds_until_reset, 0);
}

#[test]
fn missing_mission_returns_predictable_state() {
    let (_env, client) = setup();

    let summary = client.participation_summary(&42);
    assert!(!summary.mission_exists);
    assert_eq!(summary.total_checkins, 0);

    let window = client.reset_window(&42);
    assert!(!window.mission_exists);
    assert!(!window.window_elapsed);
}

#[test]
fn check_in_frequency_snapshot_computes_rate() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.configure_mission(&1, &2_000); // window_start = 0
    client.check_in(&1, &alice);
    client.check_in(&1, &alice);
    client.check_in(&1, &bob);

    env.ledger().with_mut(|li| li.timestamp = 1_000);
    let snap = client.check_in_frequency_snapshot(&1);
    assert!(snap.mission_exists);
    assert_eq!(snap.total_checkins, 3);
    assert_eq!(snap.unique_participants, 2);
    // 3 * 1000 / 1000 = 3
    assert_eq!(snap.checkins_per_1k_secs, 3);
    // 2 * 10_000 / 3 = 6666 bps
    assert_eq!(snap.unique_ratio_bps, 6_666);
}

#[test]
fn check_in_frequency_snapshot_missing_mission() {
    let (_env, client) = setup();
    let snap = client.check_in_frequency_snapshot(&99);
    assert!(!snap.mission_exists);
    assert_eq!(snap.checkins_per_1k_secs, 0);
    assert_eq!(snap.unique_ratio_bps, 0);
}

#[test]
fn streak_decay_active_participant_not_decayed() {
    let (env, client) = setup();
    let alice = Address::generate(&env);

    client.configure_mission(&1, &1_000); // window_start = 0
    client.check_in(&1, &alice);

    // Still within the window
    env.ledger().with_mut(|li| li.timestamp = 500);
    let decay = client.streak_decay(&1, &alice);
    assert!(decay.mission_exists);
    assert!(decay.participant_active_this_window);
    assert!(!decay.window_elapsed);
    assert!(!decay.streak_decayed);
    assert_eq!(decay.seconds_until_decay, 500);
}

#[test]
fn streak_decay_elapsed_without_checkin() {
    let (env, client) = setup();
    let alice = Address::generate(&env);

    client.configure_mission(&1, &1_000);
    // Alice never checks in; move past the window
    env.ledger().with_mut(|li| li.timestamp = 1_500);
    let decay = client.streak_decay(&1, &alice);
    assert!(decay.window_elapsed);
    assert!(!decay.participant_active_this_window);
    assert!(decay.streak_decayed);
    assert_eq!(decay.seconds_until_decay, 0);
}

#[test]
fn streak_decay_missing_mission() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    let decay = client.streak_decay(&99, &alice);
    assert!(!decay.mission_exists);
    assert!(!decay.streak_decayed);
}
