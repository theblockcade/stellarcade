#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, BytesN, Env, Symbol,
};

struct TestSetup<'a> {
    env: Env,
    client: BountyEscrowClient<'a>,
    oracle: Address,
    token_address: Address,
}

fn setup<'a>(env: &'a Env) -> TestSetup<'a> {
    let oracle = Address::generate(env);
    let token_admin = Address::generate(env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract_id.address();

    let contract_id = env.register(BountyEscrow, ());
    let client = BountyEscrowClient::new(env, &contract_id);

    env.mock_all_auths();
    client.initialize(&oracle, &token_address);

    TestSetup {
        env: env.clone(),
        client,
        oracle,
        token_address,
    }
}

fn mint(env: &Env, token_address: &Address, to: &Address, amount: i128) {
    let sac_client = StellarAssetClient::new(env, token_address);
    sac_client.mint(to, &amount);
}

fn create_proof_hash(env: &Env, seed: u8) -> BytesN<32> {
    BytesN::from_array(env, &[seed; 32])
}

#[test]
fn test_sponsor_deposit_and_successful_approved_claim() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 1_000);

    let token_client = TokenClient::new(&s.env, &s.token_address);

    let game = Symbol::new(&s.env, "speedrun");
    let target_score = 50_000u64;
    let amount = 1_000i128;
    let deadline = s.env.ledger().timestamp() + 3_600;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);
    assert_eq!(bounty_id, 1);
    assert_eq!(token_client.balance(&sponsor), 0);
    assert_eq!(token_client.balance(&s.client.address), 1_000);

    let proof_hash = create_proof_hash(&s.env, 42);
    s.client.submit_claim(&player, &bounty_id, &proof_hash);

    let claim = s.client.get_claim(&bounty_id);
    assert_eq!(claim.player, player);
    assert_eq!(claim.proof_hash, proof_hash);
    assert!(!claim.approved);

    let payout = s.client.approve_bounty(&s.oracle, &bounty_id);
    assert_eq!(payout, 1_000);
    assert_eq!(token_client.balance(&player), 1_000);
    assert_eq!(token_client.balance(&s.client.address), 0);

    let bounty = s.client.get_bounty(&bounty_id);
    assert_eq!(bounty.status, BountyStatus::Completed);
    assert_eq!(bounty.remaining_amount, 0);

    let updated_claim = s.client.get_claim(&bounty_id);
    assert!(updated_claim.approved);
}

#[test]
fn test_sponsor_can_verify_and_approve_bounty() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 800);

    let game = Symbol::new(&s.env, "pacman");
    let target_score = 99_990u64;
    let amount = 800i128;
    let deadline = s.env.ledger().timestamp() + 1_800;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);

    let proof_hash = create_proof_hash(&s.env, 11);
    s.client.submit_claim(&player, &bounty_id, &proof_hash);

    let payout = s.client.approve_bounty(&sponsor, &bounty_id);
    assert_eq!(payout, 800);

    let token_client = TokenClient::new(&s.env, &s.token_address);
    assert_eq!(token_client.balance(&player), 800);
}

#[test]
fn test_expired_bounty_refund_to_sponsor() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 1_500);

    let token_client = TokenClient::new(&s.env, &s.token_address);

    let game = Symbol::new(&s.env, "tetris");
    let target_score = 100_000u64;
    let amount = 1_500i128;
    let deadline = s.env.ledger().timestamp() + 500;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);

    assert_eq!(token_client.balance(&sponsor), 0);
    assert_eq!(token_client.balance(&s.client.address), 1_500);

    s.env.ledger().set_timestamp(deadline + 1);

    let refunded = s.client.refund_bounty(&sponsor, &bounty_id);
    assert_eq!(refunded, 1_500);
    assert_eq!(token_client.balance(&sponsor), 1_500);
    assert_eq!(token_client.balance(&s.client.address), 0);

    let bounty = s.client.get_bounty(&bounty_id);
    assert_eq!(bounty.status, BountyStatus::Refunded);
    assert_eq!(bounty.remaining_amount, 0);
}

#[test]
fn test_cannot_approve_after_sponsor_reclaimed_expired_funds() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 2_000);

    let game = Symbol::new(&s.env, "galaxian");
    let target_score = 30_000u64;
    let amount = 2_000i128;
    let deadline = s.env.ledger().timestamp() + 600;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);

    let proof_hash = create_proof_hash(&s.env, 99);
    s.client.submit_claim(&player, &bounty_id, &proof_hash);

    s.env.ledger().set_timestamp(deadline + 1);

    s.client.reclaim_expired(&sponsor, &bounty_id);

    let result = s.client.try_approve_bounty(&s.oracle, &bounty_id);
    assert_eq!(result, Err(Ok(Error::AlreadyRefunded)));
}

#[test]
fn test_unauthorized_claim_approval_rejection() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    let attacker = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 1_000);

    let game = Symbol::new(&s.env, "pinball");
    let target_score = 40_000u64;
    let amount = 1_000i128;
    let deadline = s.env.ledger().timestamp() + 1_000;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);

    let proof_hash = create_proof_hash(&s.env, 12);
    s.client.submit_claim(&player, &bounty_id, &proof_hash);

    let result = s.client.try_approve_bounty(&attacker, &bounty_id);
    assert_eq!(result, Err(Ok(Error::NotAuthorized)));

    let approved = s.client.approve_bounty(&s.oracle, &bounty_id);
    assert_eq!(approved, 1_000);
}

#[test]
fn test_partial_bounty_payouts_for_tiered_objectives() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 1_000);

    let token_client = TokenClient::new(&s.env, &s.token_address);

    let game = Symbol::new(&s.env, "centipede");
    let target_score = 25_000u64;
    let amount = 1_000i128;
    let deadline = s.env.ledger().timestamp() + 2_000;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);

    let proof_hash = create_proof_hash(&s.env, 55);
    s.client.submit_claim(&player, &bounty_id, &proof_hash);

    let tier1_payout = s
        .client
        .approve_partial_bounty(&s.oracle, &bounty_id, &400);
    assert_eq!(tier1_payout, 400);
    assert_eq!(token_client.balance(&player), 400);
    assert_eq!(token_client.balance(&s.client.address), 600);

    let bounty_after_tier1 = s.client.get_bounty(&bounty_id);
    assert_eq!(bounty_after_tier1.remaining_amount, 600);
    assert_eq!(bounty_after_tier1.status, BountyStatus::PartiallyPaid);

    let tier2_payout = s
        .client
        .approve_partial_bounty(&s.oracle, &bounty_id, &600);
    assert_eq!(tier2_payout, 600);
    assert_eq!(token_client.balance(&player), 1_000);
    assert_eq!(token_client.balance(&s.client.address), 0);

    let bounty_after_tier2 = s.client.get_bounty(&bounty_id);
    assert_eq!(bounty_after_tier2.remaining_amount, 0);
    assert_eq!(bounty_after_tier2.status, BountyStatus::Completed);

    let excess_attempt = s
        .client
        .try_approve_partial_bounty(&s.oracle, &bounty_id, &100);
    assert_eq!(excess_attempt, Err(Ok(Error::AlreadyCompleted)));
}

#[test]
fn test_submit_claim_after_deadline_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 500);

    let game = Symbol::new(&s.env, "donkeykong");
    let target_score = 10_000u64;
    let amount = 500i128;
    let deadline = s.env.ledger().timestamp() + 500;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);

    s.env.ledger().set_timestamp(deadline + 1);

    let proof_hash = create_proof_hash(&s.env, 77);
    let result = s.client.try_submit_claim(&player, &bounty_id, &proof_hash);
    assert_eq!(result, Err(Ok(Error::BountyExpired)));
}

#[test]
fn test_refund_before_expiration_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 500);

    let game = Symbol::new(&s.env, "spaceinvaders");
    let target_score = 15_000u64;
    let amount = 500i128;
    let deadline = s.env.ledger().timestamp() + 500;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);

    let result = s.client.try_refund_bounty(&sponsor, &bounty_id);
    assert_eq!(result, Err(Ok(Error::BountyNotExpired)));
}

#[test]
fn test_unauthorized_refund_attempt_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    let attacker = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 500);

    let game = Symbol::new(&s.env, "frogger");
    let target_score = 8_000u64;
    let amount = 500i128;
    let deadline = s.env.ledger().timestamp() + 500;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);

    s.env.ledger().set_timestamp(deadline + 1);

    let result = s.client.try_refund_bounty(&attacker, &bounty_id);
    assert_eq!(result, Err(Ok(Error::NotAuthorized)));
}

#[test]
fn test_double_approval_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let sponsor = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    mint(&s.env, &s.token_address, &sponsor, 600);

    let game = Symbol::new(&s.env, "breakout");
    let target_score = 12_000u64;
    let amount = 600i128;
    let deadline = s.env.ledger().timestamp() + 1_000;

    let bounty_id = s
        .client
        .post_bounty(&sponsor, &game, &target_score, &amount, &deadline);

    let proof_hash = create_proof_hash(&s.env, 88);
    s.client.submit_claim(&player, &bounty_id, &proof_hash);

    s.client.approve_bounty(&s.oracle, &bounty_id);

    let second_approval = s.client.try_approve_bounty(&s.oracle, &bounty_id);
    assert_eq!(second_approval, Err(Ok(Error::AlreadyCompleted)));
}

#[test]
fn test_duplicate_initialization_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let s = setup(&env);

    let result = s
        .client
        .try_initialize(&s.oracle, &s.token_address);
    assert_eq!(result, Err(Ok(Error::AlreadyInitialized)));
}
