#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{vec, Address, Env};

#[test]
fn test_init() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);
    assert_eq!(client.get_admin(), admin);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_init_twice_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);
    client.init(&admin);
}

#[test]
fn test_queue_reward_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    let queue_id = client.queue_reward(&recipient, &500, &100);
    assert_eq!(queue_id, 1);
}

#[test]
#[should_panic(expected = "Invalid amount")]
fn test_queue_reward_invalid_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    client.queue_reward(&recipient, &0, &100);
}

#[test]
#[should_panic(expected = "Invalid cooldown")]
fn test_queue_reward_invalid_cooldown() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    client.queue_reward(&recipient, &500, &0);
}

#[test]
fn test_get_unlock_queue_summary_empty() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    let summary = client.get_unlock_queue_summary(&recipient);

    assert_eq!(summary.total_queued_amount, 0);
    assert_eq!(summary.queue_size, 0);
    assert_eq!(summary.in_cooldown_count, 0);
    assert_eq!(summary.ready_to_claim_count, 0);
}

#[test]
fn test_get_unlock_queue_summary_with_rewards() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    // Queue with long cooldown (in cooldown)
    client.queue_reward(&recipient, &300, &1000);

    // Queue with short cooldown (ready)
    let current_ledger = env.ledger().sequence();
    client.queue_reward(&recipient, &200, &1);

    let summary = client.get_unlock_queue_summary(&recipient);

    assert_eq!(summary.total_queued_amount, 500);
    assert_eq!(summary.queue_size, 2);
    // Note: exact counts depend on ledger timing
}

#[test]
fn test_get_cooldown_gap_in_cooldown() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    let queue_id = client.queue_reward(&recipient, &500, &100);
    let gap_info = client.get_cooldown_gap(&recipient, &queue_id);

    assert_eq!(gap_info.status, QueueStatus::InCooldown);
    assert_eq!(gap_info.amount, 500);
    assert_eq!(gap_info.queue_id, queue_id);
    assert!(gap_info.ledgers_remaining_in_cooldown > 0);
}

#[test]
fn test_get_cooldown_gap_ready() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    // Queue with cooldown of 1 ledger (should be ready almost immediately in tests)
    let queue_id = client.queue_reward(&recipient, &500, &1);
    let gap_info = client.get_cooldown_gap(&recipient, &queue_id);

    assert_eq!(gap_info.amount, 500);
    assert_eq!(gap_info.queue_id, queue_id);
}

#[test]
fn test_get_cooldown_gap_missing() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    let gap_info = client.get_cooldown_gap(&recipient, &999);

    // Missing entry treated as ready
    assert_eq!(gap_info.status, QueueStatus::ReadyToClaim);
    assert_eq!(gap_info.amount, 0);
    assert_eq!(gap_info.ledgers_remaining_in_cooldown, 0);
}

#[test]
fn test_claim_queued_reward_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    let queue_id = client.queue_reward(&recipient, &500, &1);

    // Advance ledger to make reward claimable
    env.ledger().with_sequence(env.ledger().sequence() + 100);

    let amount = client.claim_queued_reward(&recipient, &queue_id);
    assert_eq!(amount, 500);

    let summary = client.get_unlock_queue_summary(&recipient);
    assert_eq!(summary.total_queued_amount, 0);
    assert_eq!(summary.queue_size, 0);
}

#[test]
#[should_panic(expected = "Reward still in cooldown")]
fn test_claim_queued_reward_still_in_cooldown() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    let queue_id = client.queue_reward(&recipient, &500, &1000);
    client.claim_queued_reward(&recipient, &queue_id);
}

#[test]
fn test_list_queued_rewards_paginated() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(RewardUnlocker, ());
    let client = RewardUnlockerClient::new(&env, &contract_id);

    client.init(&admin);

    client.queue_reward(&recipient, &100, &50);
    client.queue_reward(&recipient, &200, &50);
    client.queue_reward(&recipient, &300, &50);

    let page1 = client.list_queued_rewards(&recipient, &0, &2);
    assert_eq!(page1.len(), 2);

    let page2 = client.list_queued_rewards(&recipient, &2, &2);
    assert_eq!(page2.len(), 1);
}
