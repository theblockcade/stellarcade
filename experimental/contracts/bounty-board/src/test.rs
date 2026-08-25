#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, BytesN, Env};
use types::BountyStatus;

#[test]
fn test_happy_path() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(BountyBoardContract, ());
    let client = BountyBoardContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let hunter = Address::generate(&env);
    let desc_hash = BytesN::from_array(&env, &[1u8; 32]);
    let proof_hash = BytesN::from_array(&env, &[2u8; 32]);

    let bounty_id = client.create_bounty(&creator, &1000u128, &1000u64, &desc_hash);
    assert_eq!(bounty_id, 1);

    client.claim_bounty(&bounty_id, &hunter);
    let summary = client.get_bounty(&bounty_id);
    assert_eq!(summary.status, BountyStatus::Claimed);
    assert_eq!(summary.hunter, Some(hunter.clone()));

    client.submit_work(&bounty_id, &hunter, &proof_hash);
    let summary = client.get_bounty(&bounty_id);
    assert_eq!(summary.status, BountyStatus::Submitted);

    client.approve_work(&bounty_id, &creator);
    let summary = client.get_bounty(&bounty_id);
    assert_eq!(summary.status, BountyStatus::Approved);
}

#[test]
fn test_review_timeout() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(BountyBoardContract, ());
    let client = BountyBoardContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let hunter = Address::generate(&env);
    let desc_hash = BytesN::from_array(&env, &[1u8; 32]);
    let proof_hash = BytesN::from_array(&env, &[2u8; 32]);

    let bounty_id = client.create_bounty(&creator, &500u128, &2000u64, &desc_hash);
    client.claim_bounty(&bounty_id, &hunter);
    client.submit_work(&bounty_id, &hunter, &proof_hash);

    // Fast forward time past review window
    env.ledger().with_mut(|l| l.timestamp += 100_000);

    client.claim_review_timeout(&bounty_id, &hunter);
    let summary = client.get_bounty(&bounty_id);
    assert_eq!(summary.status, BountyStatus::Approved);
}

#[test]
fn test_cancel_expired_unclaimed_bounty() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(BountyBoardContract, ());
    let client = BountyBoardContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let desc_hash = BytesN::from_array(&env, &[1u8; 32]);

    let bounty_id = client.create_bounty(&creator, &500u128, &1000u64, &desc_hash);

    // Fast forward time past deadline
    env.ledger().with_mut(|l| l.timestamp = 1001);

    client.cancel_bounty(&bounty_id, &creator);
    let summary = client.get_bounty(&bounty_id);
    assert_eq!(summary.status, BountyStatus::Cancelled);
}
