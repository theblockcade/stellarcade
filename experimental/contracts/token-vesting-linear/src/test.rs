#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env};

#[test]
fn test_release_before_cliff() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TokenVestingLinearContract, ());
    let client = TokenVestingLinearContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let start_ts = 1000u64;
    let cliff_sec = 500u64;
    let duration_sec = 1000u64;
    let total_amount = 10000u128;

    env.ledger().with_mut(|l| l.timestamp = start_ts);

    let schedule_id = client.create_schedule(
        &admin,
        &beneficiary,
        &total_amount,
        &start_ts,
        &cliff_sec,
        &duration_sec,
        &true,
    );

    // Before cliff (1200 < 1500)
    env.ledger().with_mut(|l| l.timestamp = 1200);
    assert_eq!(client.get_releasable_amount(&schedule_id), 0);
}

#[test]
fn test_release_at_half_duration() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TokenVestingLinearContract, ());
    let client = TokenVestingLinearContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let start_ts = 1000u64;
    let cliff_sec = 200u64;
    let duration_sec = 1000u64;
    let total_amount = 10000u128;

    env.ledger().with_mut(|l| l.timestamp = start_ts);

    let schedule_id = client.create_schedule(
        &admin,
        &beneficiary,
        &total_amount,
        &start_ts,
        &cliff_sec,
        &duration_sec,
        &true,
    );

    // 50% duration elapsed (start_ts + 500 = 1500)
    env.ledger().with_mut(|l| l.timestamp = 1500);
    assert_eq!(client.get_releasable_amount(&schedule_id), 5000);

    let released = client.release(&schedule_id);
    assert_eq!(released, 5000);

    let summary = client.get_schedule(&schedule_id);
    assert_eq!(summary.released_amount, 5000);
}

#[test]
fn test_release_after_completion() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TokenVestingLinearContract, ());
    let client = TokenVestingLinearContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let start_ts = 1000u64;
    let cliff_sec = 200u64;
    let duration_sec = 1000u64;
    let total_amount = 10000u128;

    env.ledger().with_mut(|l| l.timestamp = start_ts);

    let schedule_id = client.create_schedule(
        &admin,
        &beneficiary,
        &total_amount,
        &start_ts,
        &cliff_sec,
        &duration_sec,
        &true,
    );

    // Full duration elapsed (start_ts + 1000 = 2000)
    env.ledger().with_mut(|l| l.timestamp = 2050);
    assert_eq!(client.get_releasable_amount(&schedule_id), 10000);

    let released = client.release(&schedule_id);
    assert_eq!(released, 10000);
}

#[test]
fn test_schedule_revocation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TokenVestingLinearContract, ());
    let client = TokenVestingLinearContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let start_ts = 1000u64;
    let cliff_sec = 200u64;
    let duration_sec = 1000u64;
    let total_amount = 10000u128;

    env.ledger().with_mut(|l| l.timestamp = start_ts);

    let schedule_id = client.create_schedule(
        &admin,
        &beneficiary,
        &total_amount,
        &start_ts,
        &cliff_sec,
        &duration_sec,
        &true,
    );

    // Revoke at 40% duration (start_ts + 400 = 1400)
    env.ledger().with_mut(|l| l.timestamp = 1400);
    let (bene_share, admin_refund) = client.revoke(&schedule_id, &admin);

    assert_eq!(bene_share, 4000);
    assert_eq!(admin_refund, 6000);

    let summary = client.get_schedule(&schedule_id);
    assert!(summary.revoked);
}
