#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{vec, Address, Env};

#[test]
fn test_init() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    assert_eq!(client.get_admin(), admin);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_init_twice_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);
    client.init(&admin);
}

#[test]
fn test_create_lock_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let current_ledger = env.ledger().sequence();
    let unlock_ledger = current_ledger + 100;

    let lock_id = client.create_lock(&beneficiary, &1000_i128, &(unlock_ledger as u32));
    assert_eq!(lock_id, 1);
}

#[test]
#[should_panic(expected = "Invalid amount")]
fn test_create_lock_invalid_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let current_ledger = env.ledger().sequence();
    let unlock_ledger = current_ledger + 100;

    client.create_lock(&beneficiary, &0, &(unlock_ledger as u32));
}

#[test]
fn test_get_balance_lock_summary_empty() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let summary = client.get_balance_lock_summary(&beneficiary);

    assert_eq!(summary.total_locked, 0);
    assert_eq!(summary.lock_count, 0);
    assert_eq!(summary.ready_to_unlock_count, 0);
    assert_eq!(summary.ready_to_unlock_amount, 0);
}

#[test]
fn test_get_balance_lock_summary_with_locks() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let current_ledger = env.ledger().sequence();
    let unlock_ledger_future = current_ledger + 100;
    let unlock_ledger_past = current_ledger - 10; // Already unlockable

    client.create_lock(&beneficiary, &1000, &(unlock_ledger_future as u32));
    client.create_lock(&beneficiary, &500, &(unlock_ledger_past as u32));

    let summary = client.get_balance_lock_summary(&beneficiary);

    assert_eq!(summary.total_locked, 1500);
    assert_eq!(summary.lock_count, 2);
    assert_eq!(summary.ready_to_unlock_count, 1);
    assert_eq!(summary.ready_to_unlock_amount, 500);
}

#[test]
fn test_get_unlock_readiness_locked() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let current_ledger = env.ledger().sequence() as u32;
    let unlock_ledger = current_ledger + 100;

    let lock_id = client.create_lock(&beneficiary, &1000, &unlock_ledger);
    let readiness = client.get_unlock_readiness(&beneficiary, &lock_id);

    assert_eq!(readiness.status, LockStatus::Locked);
    assert_eq!(readiness.amount, 1000);
    assert_eq!(readiness.lock_id, 1);
    assert!(readiness.ledgers_remaining > 0);
}

#[test]
fn test_get_unlock_readiness_ready() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let current_ledger = env.ledger().sequence() as u32;
    let unlock_ledger = current_ledger - 10; // Already ready

    let lock_id = client.create_lock(&beneficiary, &1000, &unlock_ledger);
    let readiness = client.get_unlock_readiness(&beneficiary, &lock_id);

    assert_eq!(readiness.status, LockStatus::ReadyToUnlock);
    assert_eq!(readiness.amount, 1000);
    assert_eq!(readiness.ledgers_remaining, 0);
}

#[test]
fn test_get_unlock_readiness_missing_lock() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let readiness = client.get_unlock_readiness(&beneficiary, &999);

    // Missing lock treated as unlocked
    assert_eq!(readiness.status, LockStatus::Unlocked);
    assert_eq!(readiness.amount, 0);
    assert_eq!(readiness.ledgers_remaining, 0);
}

#[test]
fn test_claim_lock_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let current_ledger = env.ledger().sequence() as u32;
    let unlock_ledger = current_ledger - 10; // Already ready

    let lock_id = client.create_lock(&beneficiary, &1000, &unlock_ledger);

    let amount = client.claim_lock(&beneficiary, &lock_id);
    assert_eq!(amount, 1000);

    let summary = client.get_balance_lock_summary(&beneficiary);
    assert_eq!(summary.total_locked, 0);
    assert_eq!(summary.lock_count, 0);
}

#[test]
#[should_panic(expected = "Lock not yet ready to unlock")]
fn test_claim_lock_not_ready() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let current_ledger = env.ledger().sequence() as u32;
    let unlock_ledger = current_ledger + 100; // Not ready yet

    let lock_id = client.create_lock(&beneficiary, &1000, &unlock_ledger);
    client.claim_lock(&beneficiary, &lock_id);
}

#[test]
fn test_list_locks_paginated() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let contract_id = env.register(AssetEscrowV3, ());
    let client = AssetEscrowV3Client::new(&env, &contract_id);

    client.init(&admin);

    let current_ledger = env.ledger().sequence() as u32;
    let unlock_ledger = current_ledger + 100;

    let id1 = client.create_lock(&beneficiary, &1000, &unlock_ledger);
    let id2 = client.create_lock(&beneficiary, &2000, &unlock_ledger);
    let id3 = client.create_lock(&beneficiary, &3000, &unlock_ledger);

    let page1 = client.list_locks(&beneficiary, &0, &2);
    assert_eq!(page1.len(), 2);

    let page2 = client.list_locks(&beneficiary, &2, &2);
    assert_eq!(page2.len(), 1);
}
