#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(env: &Env) -> (RankRewardsClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let user = Address::generate(env);
    let contract_id = env.register(RankRewards, ());
    let client = RankRewardsClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, user)
}

#[test]
fn summary_and_readiness_cover_success_path() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 2_500);

    let (client, admin, user) = setup(&env);
    client.upsert_bracket(&admin, &1, &1, &100, &50u128, &600, &false);
    client.set_player_rank(&admin, &user, &1, &25, &2_000);

    let summary = client.bracket_reward_summary(&1);
    assert!(summary.exists);
    assert_eq!(summary.state, BracketState::Active);
    assert_eq!(summary.player_count, 1);
    assert_eq!(summary.total_reward_owed, 50u128);
    assert_eq!(summary.rollover_cooldown_secs, 600);

    let readiness = client.rollover_readiness_accessor(&user);
    assert!(readiness.player_found && readiness.bracket_found);
    assert_eq!(readiness.next_rollover_at, 2_600);
    assert_eq!(readiness.seconds_until_ready, 100);
    assert_eq!(readiness.readiness, RolloverReadiness::NotReady);
}

#[test]
fn ready_after_cooldown_and_blocked_when_paused() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 5_000);

    let (client, admin, user) = setup(&env);
    client.upsert_bracket(&admin, &2, &1, &50, &10u128, &200, &false);
    client.set_player_rank(&admin, &user, &2, &5, &4_700);

    // Now (5_000) is past the cooldown (4_700 + 200 = 4_900).
    let ready = client.rollover_readiness_accessor(&user);
    assert_eq!(ready.readiness, RolloverReadiness::Ready);
    assert_eq!(ready.seconds_until_ready, 0);

    // Pause the bracket — readiness becomes BlockedByPause.
    client.upsert_bracket(&admin, &2, &1, &50, &10u128, &200, &true);
    let blocked = client.rollover_readiness_accessor(&user);
    assert_eq!(blocked.readiness, RolloverReadiness::BlockedByPause);
    assert!(blocked.bracket_paused);
    // Summary reflects the pause.
    assert_eq!(client.bracket_reward_summary(&2).state, BracketState::Paused);
}

#[test]
fn empty_and_missing_states_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_234);

    let (client, _admin, user) = setup(&env);

    let summary = client.bracket_reward_summary(&999);
    assert!(!summary.exists);
    assert_eq!(summary.state, BracketState::Missing);
    assert_eq!(summary.total_reward_owed, 0u128);

    let readiness = client.rollover_readiness_accessor(&user);
    assert!(!readiness.player_found);
    assert_eq!(readiness.readiness, RolloverReadiness::NoRecord);
}

#[test]
fn bracket_migration_moves_aggregates_atomically() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 100);

    let (client, admin, user) = setup(&env);
    client.upsert_bracket(&admin, &1, &1, &10, &30u128, &500, &false);
    client.upsert_bracket(&admin, &2, &11, &20, &70u128, &500, &false);

    client.set_player_rank(&admin, &user, &1, &5, &50);
    assert_eq!(client.bracket_reward_summary(&1).player_count, 1);
    assert_eq!(client.bracket_reward_summary(&1).total_reward_owed, 30u128);

    // Promote to bracket 2.
    client.set_player_rank(&admin, &user, &2, &15, &75);
    let b1 = client.bracket_reward_summary(&1);
    let b2 = client.bracket_reward_summary(&2);
    assert_eq!(b1.player_count, 0);
    assert_eq!(b1.total_reward_owed, 0u128);
    assert_eq!(b2.player_count, 1);
    assert_eq!(b2.total_reward_owed, 70u128);
}
