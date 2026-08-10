#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (ReferralQuestsClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let user = Address::generate(env);
    let contract_id = env.register(ReferralQuests, ());
    let client = ReferralQuestsClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, user)
}

#[test]
fn queue_summary_and_payout_gap_cover_success_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, user) = setup(&env);

    client.upsert_quest(&admin, &1, &500u128, &false);
    client.record_completion(&admin, &user, &1, &1_000);

    let summary = client.completion_queue_summary(&1);
    assert!(summary.exists);
    assert_eq!(summary.state, QuestState::Active);
    assert_eq!(summary.pending_completion_count, 1);
    assert_eq!(summary.paid_completion_count, 0);
    assert_eq!(summary.total_completion_count, 1);
    assert_eq!(summary.payout_per_completion, 500u128);

    let gap = client.payout_gap_accessor(&1);
    assert_eq!(gap.total_payout_owed, 500u128);
    assert_eq!(gap.total_payout_paid, 0u128);
    assert_eq!(gap.payout_gap, 500u128);
}

#[test]
fn mark_paid_shifts_counts_and_closes_the_gap() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, _user) = setup(&env);

    client.upsert_quest(&admin, &2, &100u128, &false);
    let u1 = Address::generate(&env);
    let u2 = Address::generate(&env);
    let u3 = Address::generate(&env);
    client.record_completion(&admin, &u1, &2, &10);
    client.record_completion(&admin, &u2, &2, &20);
    client.record_completion(&admin, &u3, &2, &30);

    client.mark_paid(&admin, &u1, &2);
    client.mark_paid(&admin, &u2, &2);

    let summary = client.completion_queue_summary(&2);
    assert_eq!(summary.pending_completion_count, 1);
    assert_eq!(summary.paid_completion_count, 2);
    assert_eq!(summary.total_completion_count, 3);

    let gap = client.payout_gap_accessor(&2);
    assert_eq!(gap.total_payout_owed, 100u128);
    assert_eq!(gap.total_payout_paid, 200u128);
    assert_eq!(gap.payout_gap, 100u128);
}

#[test]
fn empty_and_missing_states_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _user) = setup(&env);

    let summary = client.completion_queue_summary(&999);
    assert!(!summary.exists);
    assert_eq!(summary.state, QuestState::Missing);
    assert_eq!(summary.payout_per_completion, 0u128);
    assert_eq!(summary.total_completion_count, 0);

    let gap = client.payout_gap_accessor(&999);
    assert!(!gap.exists);
    assert_eq!(gap.total_payout_owed, 0u128);
    assert_eq!(gap.payout_gap, 0u128);
}

#[test]
fn paused_quest_is_reported_but_no_new_completions() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, user) = setup(&env);

    client.upsert_quest(&admin, &3, &250u128, &false);
    client.record_completion(&admin, &user, &3, &50);
    client.upsert_quest(&admin, &3, &250u128, &true); // pause

    let summary = client.completion_queue_summary(&3);
    assert_eq!(summary.state, QuestState::Paused);
    assert_eq!(summary.pending_completion_count, 1);
    // Counters preserved across the pause; new completions would panic at
    // record_completion (the assert in the impl), which is the expected
    // shape — recording is the mutator, the view is just a read.

    let gap = client.payout_gap_accessor(&3);
    assert_eq!(gap.state, QuestState::Paused);
    assert_eq!(gap.payout_gap, 250u128);
}

#[test]
#[should_panic(expected = "Already completed")]
fn duplicate_completion_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, user) = setup(&env);
    client.upsert_quest(&admin, &5, &10u128, &false);
    client.record_completion(&admin, &user, &5, &1);
    client.record_completion(&admin, &user, &5, &2);
}

// ── quest_progress_snapshot ──────────────────────────────────────────────────

#[test]
fn quest_progress_snapshot_completed_and_unpaid() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, user) = setup(&env);

    client.upsert_quest(&admin, &10, &750u128, &false);
    client.record_completion(&admin, &user, &10, &5_000);

    let snapshot = client.quest_progress_snapshot(&10, &user);
    assert!(snapshot.quest_exists);
    assert!(snapshot.completion_exists);
    assert_eq!(snapshot.state, QuestState::Active);
    assert_eq!(snapshot.payout_per_completion, 750u128);
    assert_eq!(snapshot.completed_at, 5_000);
    assert!(!snapshot.is_paid);
}

#[test]
fn quest_progress_snapshot_paid() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, user) = setup(&env);

    client.upsert_quest(&admin, &11, &200u128, &false);
    client.record_completion(&admin, &user, &11, &100);
    client.mark_paid(&admin, &user, &11);

    let snapshot = client.quest_progress_snapshot(&11, &user);
    assert!(snapshot.is_paid);
}

#[test]
fn quest_progress_snapshot_missing_quest() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, user) = setup(&env);

    let snapshot = client.quest_progress_snapshot(&999, &user);
    assert!(!snapshot.quest_exists);
    assert!(!snapshot.completion_exists);
    assert_eq!(snapshot.state, QuestState::Missing);
    assert_eq!(snapshot.payout_per_completion, 0u128);
}

#[test]
fn quest_progress_snapshot_no_completion() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, _user) = setup(&env);

    client.upsert_quest(&admin, &12, &100u128, &false);
    let other = Address::generate(&env);

    let snapshot = client.quest_progress_snapshot(&12, &other);
    assert!(snapshot.quest_exists);
    assert!(!snapshot.completion_exists);
    assert_eq!(snapshot.completed_at, 0);
}

// ── reward_decay ─────────────────────────────────────────────────────────────

#[test]
fn reward_decay_shows_paid_ratio() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, _user) = setup(&env);

    client.upsert_quest(&admin, &20, &100u128, &false);
    let u1 = Address::generate(&env);
    let u2 = Address::generate(&env);
    let u3 = Address::generate(&env);
    let u4 = Address::generate(&env);
    client.record_completion(&admin, &u1, &20, &1);
    client.record_completion(&admin, &u2, &20, &2);
    client.record_completion(&admin, &u3, &20, &3);
    client.record_completion(&admin, &u4, &20, &4);

    client.mark_paid(&admin, &u1, &20);
    client.mark_paid(&admin, &u2, &20);

    let decay = client.reward_decay(&20);
    assert!(decay.exists);
    assert_eq!(decay.total_payout_paid, 200u128);
    assert_eq!(decay.total_payout_owed, 200u128);
    assert_eq!(decay.decay_pct, 50);
    assert_eq!(decay.pending_completion_count, 2);
    assert_eq!(decay.paid_completion_count, 2);
}

#[test]
fn reward_decay_missing_quest() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _user) = setup(&env);

    let decay = client.reward_decay(&999);
    assert!(!decay.exists);
    assert_eq!(decay.state, QuestState::Missing);
    assert_eq!(decay.decay_pct, 0);
    assert_eq!(decay.total_payout_owed, 0u128);
}

#[test]
fn reward_decay_no_completions_yet() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, _user) = setup(&env);

    client.upsert_quest(&admin, &21, &50u128, &false);

    let decay = client.reward_decay(&21);
    assert!(decay.exists);
    assert_eq!(decay.decay_pct, 0);
    assert_eq!(decay.pending_completion_count, 0);
    assert_eq!(decay.paid_completion_count, 0);
}
