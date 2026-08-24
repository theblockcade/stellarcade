#![cfg(test)]

use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::token::{StellarAssetClient, TokenClient};
use soroban_sdk::{Address, BytesN, Env};

use crate::types::{BountyStatus, OptionalBountyStatus};
use crate::{BountyBoard, BountyBoardClient};

const REVIEW_WINDOW: u32 = 100;

// ── Helpers ───────────────────────────────────────────────────────────────────

fn create_token<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, StellarAssetClient<'a>, TokenClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    let sa_client = StellarAssetClient::new(env, &addr);
    let t_client = TokenClient::new(env, &addr);
    (addr, sa_client, t_client)
}

fn hash(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

struct Setup {
    env: Env,
    client: BountyBoardClient<'static>,
    contract_id: Address,
    token: Address,
    sa_client: StellarAssetClient<'static>,
    token_client: TokenClient<'static>,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_sequence_number(1000);

    let contract_id = env.register(BountyBoard, ());
    let client = BountyBoardClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let (token, sa_client, token_client) = create_token(&env, &admin);
    client.init(&admin, &token, &REVIEW_WINDOW);

    Setup {
        env,
        client,
        contract_id,
        token,
        sa_client,
        token_client,
    }
}

/// Fund `who` with `amount` and create a bounty for `reward_amount`,
/// returning (bounty_id, creator).
fn create_funded_bounty(
    setup: &Setup,
    creator: &Address,
    reward_amount: i128,
    deadline: u32,
) -> u64 {
    setup.sa_client.mint(creator, &reward_amount);
    setup
        .client
        .create_bounty(creator, &reward_amount, &deadline, &hash(&setup.env, 1))
}

// ── Happy path: create -> claim -> submit -> approve -> payout ────────────────

#[test]
fn test_happy_path_payout() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let reward: i128 = 1_000;

    let bounty_id = create_funded_bounty(&setup, &creator, reward, 2000);

    // Funds escrowed into the contract.
    assert_eq!(setup.token_client.balance(&setup.contract_id), reward);
    assert_eq!(setup.token_client.balance(&creator), 0);

    setup.client.claim_bounty(&bounty_id, &hunter);
    let view = setup.client.get_bounty(&bounty_id);
    assert_eq!(
        view.status,
        OptionalBountyStatus::Some(BountyStatus::Claimed)
    );
    assert_eq!(view.hunter, Some(hunter.clone()));

    setup
        .client
        .submit_work(&bounty_id, &hunter, &hash(&setup.env, 2));
    let view = setup.client.get_bounty(&bounty_id);
    assert_eq!(
        view.status,
        OptionalBountyStatus::Some(BountyStatus::Submitted)
    );
    assert_eq!(view.proof_hash, Some(hash(&setup.env, 2)));
    assert_eq!(view.review_deadline, Some(1000 + REVIEW_WINDOW));

    setup.client.approve_work(&bounty_id, &creator);

    // Reward released to the hunter; contract holds nothing.
    assert_eq!(setup.token_client.balance(&hunter), reward);
    assert_eq!(setup.token_client.balance(&setup.contract_id), 0);

    let view = setup.client.get_bounty(&bounty_id);
    assert_eq!(
        view.status,
        OptionalBountyStatus::Some(BountyStatus::Completed)
    );
}

// ── Review timeout: hunter auto-releases payout after window lapses ───────────

#[test]
fn test_review_timeout_auto_release() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let reward: i128 = 500;

    let bounty_id = create_funded_bounty(&setup, &creator, reward, 2000);
    setup.client.claim_bounty(&bounty_id, &hunter);
    setup
        .client
        .submit_work(&bounty_id, &hunter, &hash(&setup.env, 3));

    // Creator never reviews; advance past the review deadline.
    setup
        .env
        .ledger()
        .set_sequence_number(1000 + REVIEW_WINDOW + 1);

    setup.client.claim_review_timeout(&bounty_id, &hunter);

    assert_eq!(setup.token_client.balance(&hunter), reward);
    assert_eq!(setup.token_client.balance(&setup.contract_id), 0);
    let view = setup.client.get_bounty(&bounty_id);
    assert_eq!(
        view.status,
        OptionalBountyStatus::Some(BountyStatus::Completed)
    );
}

// ── Creator cancellation of expired, unclaimed bounty ─────────────────────────

#[test]
fn test_creator_cancel_expired_unclaimed() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let reward: i128 = 750;

    let bounty_id = create_funded_bounty(&setup, &creator, reward, 1500);

    // Nobody claimed it; advance past the deadline and cancel.
    setup.env.ledger().set_sequence_number(1501);
    setup.client.cancel_bounty(&bounty_id, &creator);

    assert_eq!(setup.token_client.balance(&creator), reward);
    assert_eq!(setup.token_client.balance(&setup.contract_id), 0);
    let view = setup.client.get_bounty(&bounty_id);
    assert_eq!(
        view.status,
        OptionalBountyStatus::Some(BountyStatus::Cancelled)
    );
}

// ── Edge cases ────────────────────────────────────────────────────────────────

#[test]
fn test_get_bounty_missing_zero_state() {
    let setup = setup();
    let view = setup.client.get_bounty(&9999u64);
    assert!(!view.exists);
    assert_eq!(view.bounty_id, 9999u64);
    assert_eq!(view.creator, None);
    assert_eq!(view.reward_amount, None);
    assert_eq!(view.deadline, None);
    assert_eq!(view.desc_hash, None);
    assert_eq!(view.status, OptionalBountyStatus::None);
    assert_eq!(view.hunter, None);
    assert_eq!(view.proof_hash, None);
    assert_eq!(view.review_deadline, None);
}

#[test]
fn test_create_bounty_zero_reward_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    setup.sa_client.mint(&creator, &1_000i128);
    let res = setup
        .client
        .try_create_bounty(&creator, &0i128, &2000u32, &hash(&setup.env, 1));
    assert!(res.is_err());
}

#[test]
fn test_create_bounty_past_deadline_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    setup.sa_client.mint(&creator, &1_000i128);
    let res = setup
        .client
        .try_create_bounty(&creator, &100i128, &999u32, &hash(&setup.env, 1));
    assert!(res.is_err());
}

#[test]
fn test_claim_after_deadline_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let bounty_id = create_funded_bounty(&setup, &creator, 100, 1500);

    setup.env.ledger().set_sequence_number(1501);
    let res = setup.client.try_claim_bounty(&bounty_id, &hunter);
    assert!(res.is_err());
}

#[test]
fn test_claim_twice_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let other = Address::generate(&setup.env);
    let bounty_id = create_funded_bounty(&setup, &creator, 100, 2000);

    setup.client.claim_bounty(&bounty_id, &hunter);
    let res = setup.client.try_claim_bounty(&bounty_id, &other);
    assert!(res.is_err());
}

#[test]
fn test_submit_by_non_claimant_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let stranger = Address::generate(&setup.env);
    let bounty_id = create_funded_bounty(&setup, &creator, 100, 2000);

    setup.client.claim_bounty(&bounty_id, &hunter);
    let res = setup
        .client
        .try_submit_work(&bounty_id, &stranger, &hash(&setup.env, 9));
    assert!(res.is_err());
}

#[test]
fn test_approve_by_stranger_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let stranger = Address::generate(&setup.env);
    let bounty_id = create_funded_bounty(&setup, &creator, 100, 2000);

    setup.client.claim_bounty(&bounty_id, &hunter);
    setup
        .client
        .submit_work(&bounty_id, &hunter, &hash(&setup.env, 4));
    let res = setup.client.try_approve_work(&bounty_id, &stranger);
    assert!(res.is_err());

    // Funds still safely locked.
    assert_eq!(setup.token_client.balance(&setup.contract_id), 100);
}

#[test]
fn test_approve_after_review_window_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let bounty_id = create_funded_bounty(&setup, &creator, 100, 2000);

    setup.client.claim_bounty(&bounty_id, &hunter);
    setup
        .client
        .submit_work(&bounty_id, &hunter, &hash(&setup.env, 5));

    setup
        .env
        .ledger()
        .set_sequence_number(1000 + REVIEW_WINDOW + 1);
    let res = setup.client.try_approve_work(&bounty_id, &creator);
    assert!(res.is_err());
}

#[test]
fn test_timeout_claim_before_window_expires_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let bounty_id = create_funded_bounty(&setup, &creator, 100, 2000);

    setup.client.claim_bounty(&bounty_id, &hunter);
    setup
        .client
        .submit_work(&bounty_id, &hunter, &hash(&setup.env, 6));

    let res = setup.client.try_claim_review_timeout(&bounty_id, &hunter);
    assert!(res.is_err());
}

#[test]
fn test_timeout_claim_by_stranger_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let stranger = Address::generate(&setup.env);
    let bounty_id = create_funded_bounty(&setup, &creator, 100, 2000);

    setup.client.claim_bounty(&bounty_id, &hunter);
    setup
        .client
        .submit_work(&bounty_id, &hunter, &hash(&setup.env, 7));

    setup
        .env
        .ledger()
        .set_sequence_number(1000 + REVIEW_WINDOW + 1);
    let res = setup.client.try_claim_review_timeout(&bounty_id, &stranger);
    assert!(res.is_err());
}

#[test]
fn test_cancel_before_deadline_panics() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let bounty_id = create_funded_bounty(&setup, &creator, 100, 2000);

    let res = setup.client.try_cancel_bounty(&bounty_id, &creator);
    assert!(res.is_err());
}

#[test]
fn test_double_payout_prevented() {
    let setup = setup();
    let creator = Address::generate(&setup.env);
    let hunter = Address::generate(&setup.env);
    let reward: i128 = 100;
    let bounty_id = create_funded_bounty(&setup, &creator, reward, 2000);

    setup.client.claim_bounty(&bounty_id, &hunter);
    setup
        .client
        .submit_work(&bounty_id, &hunter, &hash(&setup.env, 8));
    setup.client.approve_work(&bounty_id, &creator);

    // Second approve must fail; no double spend.
    let res = setup.client.try_approve_work(&bounty_id, &creator);
    assert!(res.is_err());
    assert_eq!(setup.token_client.balance(&hunter), reward);
    assert_eq!(setup.token_client.balance(&setup.contract_id), 0);
}

#[test]
fn test_bounty_ids_increment_and_list() {
    let setup = setup();
    let creator = Address::generate(&setup.env);

    let id1 = create_funded_bounty(&setup, &creator, 100, 2000);
    let id2 = create_funded_bounty(&setup, &creator, 100, 2000);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    let ids = setup.client.get_all_bounty_ids();
    assert_eq!(ids.len(), 2);
    assert_eq!(ids.get(0).unwrap(), 1);
    assert_eq!(ids.get(1).unwrap(), 2);
}

#[test]
fn test_review_window_accessor() {
    let setup = setup();
    assert_eq!(setup.client.get_review_window(), REVIEW_WINDOW);
}
