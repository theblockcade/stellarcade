#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token::StellarAssetClient, Address, Env, Vec};

fn setup(env: &Env) -> (BattlePassEscrowClient<'_>, Address, Address) {
    let oracle = Address::generate(env);
    let token_admin = Address::generate(env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract_id.address();

    let contract_id = env.register(BattlePassEscrow, ());
    let client = BattlePassEscrowClient::new(env, &contract_id);

    env.mock_all_auths();
    client.initialize(&oracle, &token_address);

    (client, oracle, token_address)
}

fn mint(env: &Env, token_address: &Address, to: &Address, amount: i128) {
    let sac_client = StellarAssetClient::new(env, token_address);
    sac_client.mint(to, &amount);
}

fn create_milestone(_env: &Env, xp_threshold: u128, reward_amount: i128) -> Milestone {
    Milestone {
        xp_threshold,
        reward_amount,
    }
}

// ---------------------------------------------------------------------------
// 1. oracle XP reporting and tier unlock
// ---------------------------------------------------------------------------

#[test]
fn test_oracle_xp_reporting_and_tier_unlock() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, oracle, token_address) = setup(&env);

    let sponsor = Address::generate(&env);
    mint(&env, &token_address, &sponsor, 1_000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(create_milestone(&env, 100, 100));
    milestones.push_back(create_milestone(&env, 200, 200));
    milestones.push_back(create_milestone(&env, 300, 300));

    client.fund_pass(&sponsor, &1, &1_000, &milestones);

    let player = Address::generate(&env);

    // Initial XP is 0
    assert_eq!(client.get_player_xp(&player, &1), 0);

    // Oracle updates player XP to 150
    client.update_xp(&oracle, &player, &1, &150);
    assert_eq!(client.get_player_xp(&player, &1), 150);

    // Oracle updates player XP to 250 (should unlock second milestone)
    client.update_xp(&oracle, &player, &1, &100);
    assert_eq!(client.get_player_xp(&player, &1), 250);
}

// ---------------------------------------------------------------------------
// 2. claim execution transferring tokens to player
// ---------------------------------------------------------------------------

#[test]
fn test_claim_execution_transfers_tokens() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, oracle, token_address) = setup(&env);

    let sponsor = Address::generate(&env);
    mint(&env, &token_address, &sponsor, 1_000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(create_milestone(&env, 100, 100));
    milestones.push_back(create_milestone(&env, 200, 200));

    client.fund_pass(&sponsor, &1, &1_000, &milestones);

    let player = Address::generate(&env);

    // Oracle updates player XP to 150 (unlocks first milestone)
    client.update_xp(&oracle, &player, &1, &150);

    // Player claims first milestone
    let claimed = client.claim_milestone_reward(&player, &1, &0);
    assert_eq!(claimed, 100);

    // Verify claim was recorded
    let xp = client.get_player_xp(&player, &1);
    assert_eq!(xp, 150);

    // Try to claim same milestone again (should fail)
    let duplicate_claim = client.try_claim_milestone_reward(&player, &1, &0);
    assert!(duplicate_claim.is_err());

    // Oracle updates player XP to 250 (unlocks second milestone)
    client.update_xp(&oracle, &player, &1, &100);

    // Player claims second milestone
    let claimed2 = client.claim_milestone_reward(&player, &1, &1);
    assert_eq!(claimed2, 200);
}

// ---------------------------------------------------------------------------
// 3. unauthorized XP reporting rejection
// ---------------------------------------------------------------------------

#[test]
fn test_unauthorized_xp_reporting_rejection() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, oracle, token_address) = setup(&env);

    let sponsor = Address::generate(&env);
    mint(&env, &token_address, &sponsor, 1_000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(create_milestone(&env, 100, 100));

    client.fund_pass(&sponsor, &1, &1_000, &milestones);

    let player = Address::generate(&env);
    let unauthorized_oracle = Address::generate(&env);

    // Unauthorized oracle tries to update XP (should fail)
    let result = client.try_update_xp(&unauthorized_oracle, &player, &1, &150);
    assert!(result.is_err());

    // Authorized oracle can still update XP
    client.update_xp(&oracle, &player, &1, &150);
    assert_eq!(client.get_player_xp(&player, &1), 150);
}

// ---------------------------------------------------------------------------
// 4. milestone cannot be claimed before XP target is met
// ---------------------------------------------------------------------------

#[test]
fn test_milestone_claim_before_xp_target_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, oracle, token_address) = setup(&env);

    let sponsor = Address::generate(&env);
    mint(&env, &token_address, &sponsor, 1_000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(create_milestone(&env, 100, 100));
    milestones.push_back(create_milestone(&env, 200, 200));

    client.fund_pass(&sponsor, &1, &1_000, &milestones);

    let player = Address::generate(&env);

    // Oracle updates player XP to 50 (below first milestone threshold)
    client.update_xp(&oracle, &player, &1, &50);

    // Try to claim first milestone (should fail - XP threshold not met)
    let result = client.try_claim_milestone_reward(&player, &1, &0);
    assert!(result.is_err());

    // Oracle updates player XP to 100 (meets first milestone threshold)
    client.update_xp(&oracle, &player, &1, &50);

    // Now claim should succeed
    let claimed = client.claim_milestone_reward(&player, &1, &0);
    assert_eq!(claimed, 100);
}

// ---------------------------------------------------------------------------
// 5. season pool stats
// ---------------------------------------------------------------------------

#[test]
fn test_season_pool_stats() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _oracle, token_address) = setup(&env);

    let sponsor = Address::generate(&env);
    mint(&env, &token_address, &sponsor, 1_000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(create_milestone(&env, 100, 100));
    milestones.push_back(create_milestone(&env, 200, 200));

    client.fund_pass(&sponsor, &1, &1_000, &milestones);

    let stats = client.get_season_pool_stats(&1);
    assert_eq!(stats.season_id, 1);
    assert_eq!(stats.total_pool, 1_000);
    assert_eq!(stats.claimed_amount, 0);
    assert_eq!(stats.unclaimed_amount, 1_000);
    assert_eq!(stats.milestone_count, 2);
}

// ---------------------------------------------------------------------------
// 6. rollover unclaimed rewards
// ---------------------------------------------------------------------------

#[test]
fn test_rollover_unclaimed_rewards() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, oracle, token_address) = setup(&env);

    let sponsor = Address::generate(&env);
    mint(&env, &token_address, &sponsor, 1_000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(create_milestone(&env, 100, 100));

    client.fund_pass(&sponsor, &1, &1_000, &milestones);

    let player = Address::generate(&env);
    client.update_xp(&oracle, &player, &1, &150);
    client.claim_milestone_reward(&player, &1, &0);

    // Mint more tokens for season 2 funding
    mint(&env, &token_address, &sponsor, 500);

    // Fund season 2
    let mut milestones2 = Vec::new(&env);
    milestones2.push_back(create_milestone(&env, 100, 50));
    client.fund_pass(&sponsor, &2, &200, &milestones2);

    // Rollover unclaimed from season 1 to season 2
    client.rollover_unclaimed(&1, &2);

    let stats = client.get_season_pool_stats(&2);
    assert_eq!(stats.total_pool, 1_100); // 200 + 900 unclaimed from season 1
}

// ---------------------------------------------------------------------------
// 7. duplicate initialization rejection
// ---------------------------------------------------------------------------

#[test]
fn test_duplicate_initialization_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _oracle, token_address) = setup(&env);

    let new_oracle = Address::generate(&env);
    let result = client.try_initialize(&new_oracle, &token_address);
    assert!(result.is_err());
}

// ---------------------------------------------------------------------------
// 8. invalid milestone index
// ---------------------------------------------------------------------------

#[test]
fn test_invalid_milestone_index() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, oracle, token_address) = setup(&env);

    let sponsor = Address::generate(&env);
    mint(&env, &token_address, &sponsor, 1_000);

    let mut milestones = Vec::new(&env);
    milestones.push_back(create_milestone(&env, 100, 100));

    client.fund_pass(&sponsor, &1, &1_000, &milestones);

    let player = Address::generate(&env);
    client.update_xp(&oracle, &player, &1, &150);

    // Try to claim milestone at index 1 (only one milestone exists at index 0)
    let result = client.try_claim_milestone_reward(&player, &1, &1);
    assert!(result.is_err());
}
