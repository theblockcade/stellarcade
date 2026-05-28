#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{vec, Address, Env};

#[test]
fn test_init() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);
    assert_eq!(client.get_admin(), admin);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_init_twice_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);
    client.init(&admin);
}

#[test]
fn test_create_milestone_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    let milestone_id = client.create_milestone(&guild_id, &1000, &500);
    assert_eq!(milestone_id, 1);
}

#[test]
#[should_panic(expected = "Invalid target progress")]
fn test_create_milestone_invalid_target() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    client.create_milestone(&guild_id, &0, &500);
}

#[test]
#[should_panic(expected = "Invalid reward amount")]
fn test_create_milestone_invalid_reward() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    client.create_milestone(&guild_id, &1000, &0);
}

#[test]
fn test_get_milestone_coverage_snapshot_empty() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    let snapshot = client.get_milestone_coverage_snapshot(&guild_id);

    assert_eq!(snapshot.total_milestones, 0);
    assert_eq!(snapshot.completed_milestones, 0);
    assert_eq!(snapshot.current_progress, 0);
    assert_eq!(snapshot.progress_percentage, 0);
}

#[test]
fn test_update_progress_and_complete_milestone() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    client.create_milestone(&guild_id, &1000, &500);

    // Update progress to below target
    client.update_progress(&guild_id, &500);
    let snapshot = client.get_milestone_coverage_snapshot(&guild_id);
    assert_eq!(snapshot.current_progress, 500);
    assert_eq!(snapshot.completed_milestones, 0);

    // Update progress to reach target
    client.update_progress(&guild_id, &1000);
    let snapshot = client.get_milestone_coverage_snapshot(&guild_id);
    assert_eq!(snapshot.current_progress, 1000);
    assert_eq!(snapshot.completed_milestones, 1);
    assert_eq!(snapshot.progress_percentage, 100);
}

#[test]
fn test_get_next_milestone_target_not_reached() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    client.create_milestone(&guild_id, &1000, &500);

    // Set progress below target
    client.update_progress(&guild_id, &300);

    let next_target = client.get_next_milestone_target(&guild_id);

    assert_eq!(next_target.next_milestone_id, 1);
    assert_eq!(next_target.target_progress, 1000);
    assert_eq!(next_target.current_progress, 300);
    assert_eq!(next_target.progress_remaining, 700);
    assert_eq!(next_target.next_reward_amount, 500);
    assert!(!next_target.all_milestones_completed);
}

#[test]
fn test_get_next_milestone_target_reached() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    client.create_milestone(&guild_id, &1000, &500);
    client.update_progress(&guild_id, &1000);

    let next_target = client.get_next_milestone_target(&guild_id);

    assert_eq!(next_target.next_milestone_id, 0);
    assert!(next_target.all_milestones_completed);
}

#[test]
fn test_get_next_milestone_target_unknown_guild() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let unknown_guild = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    let next_target = client.get_next_milestone_target(&unknown_guild);

    assert_eq!(next_target.next_milestone_id, 0);
    assert_eq!(next_target.current_progress, 0);
    assert!(next_target.all_milestones_completed);
}

#[test]
fn test_get_current_progress() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    client.update_progress(&guild_id, &750);

    let progress = client.get_current_progress(&guild_id);
    assert_eq!(progress, 750);
}

#[test]
fn test_list_milestones_paginated() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    client.create_milestone(&guild_id, &500, &100);
    client.create_milestone(&guild_id, &1000, &200);
    client.create_milestone(&guild_id, &1500, &300);

    let page1 = client.list_milestones(&guild_id, &0, &2);
    assert_eq!(page1.len(), 2);

    let page2 = client.list_milestones(&guild_id, &2, &2);
    assert_eq!(page2.len(), 1);
}

#[test]
fn test_get_milestone_details() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    let milestone_id = client.create_milestone(&guild_id, &1000, &500);

    let details = client.get_milestone_details(&guild_id, &milestone_id);

    assert_eq!(details.milestone_id, milestone_id);
    assert_eq!(details.target_progress, 1000);
    assert_eq!(details.reward_amount, 500);
    assert_eq!(details.status, MilestoneStatus::NotReached);
}

#[test]
fn test_multiple_milestones_progression() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let guild_id = Address::generate(&env);
    let contract_id = env.register(GuildProgress, ());
    let client = GuildProgressClient::new(&env, &contract_id);

    client.init(&admin);

    client.create_milestone(&guild_id, &500, &100);
    client.create_milestone(&guild_id, &1000, &200);
    client.create_milestone(&guild_id, &1500, &300);

    // Progress through milestones
    client.update_progress(&guild_id, &500);
    let snapshot = client.get_milestone_coverage_snapshot(&guild_id);
    assert_eq!(snapshot.completed_milestones, 1);
    assert_eq!(snapshot.progress_percentage, 33); // 1 out of 3

    client.update_progress(&guild_id, &1000);
    let snapshot = client.get_milestone_coverage_snapshot(&guild_id);
    assert_eq!(snapshot.completed_milestones, 2);
    assert_eq!(snapshot.progress_percentage, 66); // 2 out of 3

    client.update_progress(&guild_id, &1500);
    let snapshot = client.get_milestone_coverage_snapshot(&guild_id);
    assert_eq!(snapshot.completed_milestones, 3);
    assert_eq!(snapshot.progress_percentage, 100); // 3 out of 3
}
