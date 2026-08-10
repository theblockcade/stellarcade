#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(env: &Env) -> (StreakLadderClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let user = Address::generate(env);
    let contract_id = env.register(StreakLadder, ());
    let client = StreakLadderClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, user)
}

#[test]
fn bucket_summary_and_demotion_risk_cover_success_path() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_600);

    let (client, admin, user) = setup(&env);
    client.upsert_bucket(&admin, &3, &10, &25, &1_000, &false);
    client.assign_player(&admin, &user, &3, &14, &1_000);

    let summary = client.streak_bucket_summary(&3);
    assert!(summary.exists);
    assert_eq!(summary.state, BucketState::Active);
    assert_eq!(summary.player_count, 1);
    assert_eq!(summary.min_streak, 10);

    let risk = client.demotion_risk(&user);
    assert!(risk.player_found);
    assert!(risk.bucket_found);
    assert_eq!(risk.bucket_id, 3);
    assert_eq!(risk.demotion_at, 2_000);
    assert_eq!(risk.seconds_until_demotion, 400);
    assert_eq!(risk.risk_level, DemotionRiskLevel::Low);
    assert!(!risk.would_demote_now);
}

#[test]
fn paused_bucket_and_missing_player_reads_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_500);

    let (client, admin, user) = setup(&env);
    client.upsert_bucket(&admin, &8, &5, &9, &400, &false);
    client.assign_player(&admin, &user, &8, &6, &1_300);
    client.upsert_bucket(&admin, &8, &5, &9, &400, &true);

    let summary = client.streak_bucket_summary(&8);
    assert_eq!(summary.state, BucketState::Paused);

    let blocked = client.demotion_risk(&user);
    assert_eq!(blocked.risk_level, DemotionRiskLevel::Blocked);
    assert!(blocked.bucket_paused);

    let other_user = Address::generate(&env);
    let missing = client.demotion_risk(&other_user);
    assert!(!missing.player_found);
    assert_eq!(missing.bucket_id, 0);
}

#[test]
fn player_bucket_summary_covers_active_and_missing_states() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(StreakLadder, ());
    let client = StreakLadderClient::new(&env, &contract_id);

    let pre_init = client.player_bucket_summary(&user);
    assert!(!pre_init.configured);
    assert_eq!(pre_init.state, PlayerBucketState::NotConfigured);
    assert!(!pre_init.player_found);

    client.init(&admin);
    client.upsert_bucket(&admin, &5, &3, &9, &900, &false);
    client.assign_player(&admin, &user, &5, &6, &1_100);

    let active = client.player_bucket_summary(&user);
    assert!(active.configured);
    assert!(active.player_found);
    assert!(active.bucket_found);
    assert_eq!(active.state, PlayerBucketState::Active);
    assert_eq!(active.bucket_id, 5);
    assert_eq!(active.current_streak, 6);
    assert_eq!(active.min_streak, 3);
    assert_eq!(active.max_streak, 9);
    assert_eq!(active.bucket_player_count, 1);

    let missing_player = client.player_bucket_summary(&Address::generate(&env));
    assert_eq!(missing_player.state, PlayerBucketState::MissingPlayer);
    assert!(!missing_player.player_found);
}

// ── ladder_standings_snapshot ─────────────────────────────────────────────────

#[test]
fn ladder_standings_snapshot_shows_progress() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, user) = setup(&env);

    client.upsert_bucket(&admin, &1, &10, &20, &500, &false);
    client.assign_player(&admin, &user, &1, &15, &1_000);

    let snapshot = client.ladder_standings_snapshot(&user);
    assert!(snapshot.player_found);
    assert!(snapshot.bucket_found);
    assert_eq!(snapshot.state, PlayerBucketState::Active);
    assert_eq!(snapshot.current_streak, 15);
    assert_eq!(snapshot.streak_margin, 5);
    assert_eq!(snapshot.bucket_progress_pct, 50);
    assert_eq!(snapshot.bucket_player_count, 1);
}

#[test]
fn ladder_standings_snapshot_missing_player() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _user) = setup(&env);

    let unknown = Address::generate(&env);
    let snapshot = client.ladder_standings_snapshot(&unknown);
    assert!(!snapshot.player_found);
    assert_eq!(snapshot.state, PlayerBucketState::MissingPlayer);
    assert_eq!(snapshot.streak_margin, 0);
    assert_eq!(snapshot.bucket_progress_pct, 0);
}

// ── checkpoint_delay ─────────────────────────────────────────────────────────

#[test]
fn checkpoint_delay_shows_remaining_time() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_200);

    let (client, admin, user) = setup(&env);
    client.upsert_bucket(&admin, &2, &5, &15, &1_000, &false);
    client.assign_player(&admin, &user, &2, &8, &1_000);

    let delay = client.checkpoint_delay(&user);
    assert!(delay.player_found);
    assert!(delay.bucket_found);
    assert_eq!(delay.checkpoint_at, 2_000);
    assert_eq!(delay.delay_remaining, 800);
    assert!(!delay.is_overdue);
    assert!(!delay.bucket_paused);
}

#[test]
fn checkpoint_delay_overdue() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 3_000);

    let (client, admin, user) = setup(&env);
    client.upsert_bucket(&admin, &4, &3, &10, &500, &false);
    client.assign_player(&admin, &user, &4, &5, &2_000);

    let delay = client.checkpoint_delay(&user);
    assert!(delay.is_overdue);
    assert_eq!(delay.delay_remaining, 0);
    assert_eq!(delay.checkpoint_at, 2_500);
}

#[test]
fn checkpoint_delay_missing_player() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _user) = setup(&env);

    let unknown = Address::generate(&env);
    let delay = client.checkpoint_delay(&unknown);
    assert!(!delay.player_found);
    assert_eq!(delay.delay_remaining, 0);
    assert!(!delay.is_overdue);
}
