#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(env: &Env) -> (LadderCheckpointsClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let user = Address::generate(env);
    let contract_id = env.register(LadderCheckpoints, ());
    let client = LadderCheckpointsClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, user)
}

#[test]
fn drift_summary_and_restore_window_cover_success_path() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 5_000);

    let (client, admin, user) = setup(&env);
    client.upsert_checkpoint(&admin, &1, &50, &600, &false);
    // Player above the min — active.
    client.record_score(&admin, &user, &1, &75, &4_900);

    let summary = client.checkpoint_drift_summary(&1);
    assert!(summary.exists);
    assert_eq!(summary.state, CheckpointState::Active);
    assert_eq!(summary.active_player_count, 1);
    assert_eq!(summary.drifted_player_count, 0);
    assert_eq!(summary.total_player_count, 1);

    let restore = client.restore_window_accessor(&user);
    assert!(restore.player_found && restore.checkpoint_found);
    assert_eq!(restore.state, RestoreWindowState::NotDrifted);
    assert_eq!(restore.restore_deadline, 5_500);
    assert_eq!(restore.seconds_remaining, 500);
}

#[test]
fn drifted_player_open_window_then_closes_after_deadline() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 10_000);

    let (client, admin, user) = setup(&env);
    client.upsert_checkpoint(&admin, &2, &100, &300, &false);
    // Below min_score, so the recording reclassifies the player as drifted.
    client.record_score(&admin, &user, &2, &80, &9_900);

    let summary = client.checkpoint_drift_summary(&2);
    assert_eq!(summary.active_player_count, 0);
    assert_eq!(summary.drifted_player_count, 1);

    let restore = client.restore_window_accessor(&user);
    assert_eq!(restore.state, RestoreWindowState::Open);
    assert_eq!(restore.restore_deadline, 10_200);
    assert_eq!(restore.seconds_remaining, 200);

    // Move the ledger past the deadline.
    env.ledger().with_mut(|ledger| ledger.timestamp = 11_000);
    let closed = client.restore_window_accessor(&user);
    assert_eq!(closed.state, RestoreWindowState::Closed);
    assert_eq!(closed.seconds_remaining, 0);
}

#[test]
fn empty_and_missing_states_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);

    let (client, _admin, user) = setup(&env);

    // Unknown checkpoint id after init → exists=false, state=Missing.
    let summary = client.checkpoint_drift_summary(&999);
    assert!(!summary.exists);
    assert_eq!(summary.state, CheckpointState::Missing);
    assert_eq!(summary.total_player_count, 0);

    // No player record yet.
    let restore = client.restore_window_accessor(&user);
    assert!(!restore.player_found);
    assert_eq!(restore.state, RestoreWindowState::NoRecord);
    assert_eq!(restore.checkpoint_id, 0);
}

#[test]
fn paused_checkpoint_blocks_restore_prompts() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 2_500);

    let (client, admin, user) = setup(&env);
    client.upsert_checkpoint(&admin, &7, &10, &200, &false);
    client.record_score(&admin, &user, &7, &8, &2_400); // drifted
    client.upsert_checkpoint(&admin, &7, &10, &200, &true); // now paused

    let summary = client.checkpoint_drift_summary(&7);
    assert_eq!(summary.state, CheckpointState::Paused);
    // Population is preserved across the pause.
    assert_eq!(summary.drifted_player_count, 1);

    let blocked = client.restore_window_accessor(&user);
    assert_eq!(blocked.state, RestoreWindowState::Blocked);
    assert!(blocked.checkpoint_paused);
}

#[test]
fn score_recovery_moves_player_back_to_active() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 3_000);

    let (client, admin, user) = setup(&env);
    client.upsert_checkpoint(&admin, &4, &50, &400, &false);
    client.record_score(&admin, &user, &4, &40, &2_900); // drifted
    assert_eq!(
        client.checkpoint_drift_summary(&4).drifted_player_count,
        1
    );

    // Recover above min_score — should move drifted→active in the same
    // checkpoint without double-counting.
    client.record_score(&admin, &user, &4, &75, &2_950);
    let summary = client.checkpoint_drift_summary(&4);
    assert_eq!(summary.active_player_count, 1);
    assert_eq!(summary.drifted_player_count, 0);
    assert_eq!(summary.total_player_count, 1);

    let restore = client.restore_window_accessor(&user);
    assert_eq!(restore.state, RestoreWindowState::NotDrifted);
}
