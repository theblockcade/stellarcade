use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn create_token<'a>(env: &'a Env, admin: &Address) -> (Address, StellarAssetClient<'a>) {
    let contract = env.register_stellar_asset_contract_v2(admin.clone());
    let client = StellarAssetClient::new(env, &contract.address());
    (contract.address(), client)
}

struct Setup<'a> {
    client: StakingRewardsClient<'a>,
    admin: Address,
    staking_token: Address,
    staking_sac: StellarAssetClient<'a>,
    reward_token: Address,
    reward_sac: StellarAssetClient<'a>,
}

fn setup(env: &Env) -> Setup<'_> {
    let admin = Address::generate(env);
    let token_admin = Address::generate(env);

    let (staking_token, staking_sac) = create_token(env, &token_admin);
    let (reward_token, reward_sac) = create_token(env, &token_admin);

    let contract_id = env.register(StakingRewards, ());
    let client = StakingRewardsClient::new(env, &contract_id);

    env.mock_all_auths();
    client.init(&admin, &staking_token, &reward_token);

    Setup {
        client,
        admin,
        staking_token,
        staking_sac,
        reward_token,
        reward_sac,
    }
}

fn tc<'a>(env: &'a Env, token: &Address) -> TokenClient<'a> {
    TokenClient::new(env, token)
}

// ---------------------------------------------------------------------------
// Epoch summary — empty epoch (no epoch started yet)
// ---------------------------------------------------------------------------

#[test]
fn test_epoch_summary_no_epoch() {
    let env = Env::default();
    let s = setup(&env);

    let summary = s.client.epoch_summary();
    assert_eq!(summary.epoch_id, 0);
    assert_eq!(summary.total_rewards, 0);
    assert_eq!(summary.distributed_rewards, 0);
    assert_eq!(summary.pending_carry_over, 0);
    assert!(!summary.is_active);
}

// ---------------------------------------------------------------------------
// Reward projection — no epoch / no stake
// ---------------------------------------------------------------------------

#[test]
fn test_reward_projection_no_epoch() {
    let env = Env::default();
    let s = setup(&env);
    let staker = Address::generate(&env);

    let proj = s.client.reward_projection(&staker);
    assert_eq!(proj.epoch_id, 0);
    assert_eq!(proj.staked_amount, 0);
    assert_eq!(proj.projected_reward, 0);
    assert_eq!(proj.total_claimed, 0);
    assert_eq!(proj.lifetime_projected_total, 0);
}

// ---------------------------------------------------------------------------
// Active epoch — reward projection and summary
// ---------------------------------------------------------------------------

#[test]
fn test_epoch_summary_and_projection_active_epoch() {
    let env = Env::default();
    let s = setup(&env);
    let staker = Address::generate(&env);

    // Mint staking tokens and stake
    s.staking_sac.mint(&staker, &1_000i128);
    s.client.stake(&staker, &1_000i128);

    // Fund admin with reward tokens and start epoch
    s.reward_sac.mint(&s.admin, &500i128);
    s.client.start_epoch(&s.admin, &500i128, &0u64);

    let summary = s.client.epoch_summary();
    assert_eq!(summary.total_rewards, 500);
    assert_eq!(summary.distributed_rewards, 0);
    assert_eq!(summary.pending_carry_over, 500);
    assert!(summary.is_active);

    // Staker holds 100% of staked supply → projected = 500
    let proj = s.client.reward_projection(&staker);
    assert_eq!(proj.staked_amount, 1_000);
    assert_eq!(proj.projected_reward, 500);
    assert_eq!(proj.total_claimed, 0);
    assert_eq!(proj.lifetime_projected_total, 500);
}

// ---------------------------------------------------------------------------
// Proportional projection with two stakers
// ---------------------------------------------------------------------------

#[test]
fn test_reward_projection_proportional_two_stakers() {
    let env = Env::default();
    let s = setup(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    s.staking_sac.mint(&alice, &600i128);
    s.staking_sac.mint(&bob, &400i128);

    s.client.stake(&alice, &600i128);
    s.client.stake(&bob, &400i128);

    s.reward_sac.mint(&s.admin, &1_000i128);
    s.client.start_epoch(&s.admin, &1_000i128, &0u64);

    let alice_proj = s.client.reward_projection(&alice);
    let bob_proj = s.client.reward_projection(&bob);

    // Alice: 600/1000 * 1000 = 600; Bob: 400/1000 * 1000 = 400
    assert_eq!(alice_proj.projected_reward, 600);
    assert_eq!(bob_proj.projected_reward, 400);
}

// ---------------------------------------------------------------------------
// Partially claimed scenario
// ---------------------------------------------------------------------------

#[test]
fn test_epoch_summary_after_partial_claim() {
    let env = Env::default();
    let s = setup(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    s.staking_sac.mint(&alice, &500i128);
    s.staking_sac.mint(&bob, &500i128);

    s.client.stake(&alice, &500i128);
    s.client.stake(&bob, &500i128);

    s.reward_sac.mint(&s.admin, &1_000i128);
    s.client.start_epoch(&s.admin, &1_000i128, &0u64);

    // Alice claims her share
    s.client.claim_rewards(&alice);

    let summary = s.client.epoch_summary();
    assert_eq!(summary.distributed_rewards, 500);
    assert_eq!(summary.pending_carry_over, 500); // Bob's share still pending

    // Alice's projection should reflect zero reward (already claimed)
    // and total_claimed updated
    let alice_proj = s.client.reward_projection(&alice);
    assert_eq!(alice_proj.total_claimed, 500);

    // Bob's projection still shows 500 pending
    let bob_proj = s.client.reward_projection(&bob);
    assert_eq!(bob_proj.projected_reward, 500);
    assert_eq!(bob_proj.total_claimed, 0);
}

// ---------------------------------------------------------------------------
// Zero-stake epoch — accessor resilience
// ---------------------------------------------------------------------------

#[test]
fn test_projection_zero_stake_in_epoch() {
    let env = Env::default();
    let s = setup(&env);
    let staker = Address::generate(&env);

    // Start epoch with zero total staked
    s.reward_sac.mint(&s.admin, &200i128);
    s.client.start_epoch(&s.admin, &200i128, &0u64);

    // Projection with zero staked snapshot should return 0 safely
    let proj = s.client.reward_projection(&staker);
    assert_eq!(proj.projected_reward, 0);

    let summary = s.client.epoch_summary();
    assert_eq!(summary.total_staked_snapshot, 0);
    assert_eq!(summary.pending_carry_over, 200);
}
