#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{BonusVaultContract, BonusVaultContractClient};

#[test]
fn accrual_pressure_and_threshold_accessor_happy_path() {
    let env = Env::default();
    let id = env.register(BonusVaultContract, ());
    let client = BonusVaultContractClient::new(&env, &id);
    let admin = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);
    client.set_state(&admin, &600, &1000);

    let summary = client.get_accrual_pressure_summary();
    assert_eq!(summary.pending_accrual, 600);
    assert_eq!(summary.release_threshold, 1000);
    assert_eq!(summary.pressure_bps, 6000);
    assert!(!summary.over_threshold);

    let accessor = client.get_release_threshold_accessor();
    assert!(accessor.threshold_configured);
    assert_eq!(accessor.remaining_until_release, 400);
}

#[test]
fn accrual_pressure_unconfigured_state() {
    let env = Env::default();
    let id = env.register(BonusVaultContract, ());
    let client = BonusVaultContractClient::new(&env, &id);

    let summary = client.get_accrual_pressure_summary();
    assert_eq!(summary.pending_accrual, 0);
    assert_eq!(summary.release_threshold, 0);
    assert_eq!(summary.pressure_bps, 0);

    let accessor = client.get_release_threshold_accessor();
    assert!(!accessor.threshold_configured);
    assert_eq!(accessor.remaining_until_release, 0);
}

#[test]
fn vault_allocation_summary_happy_path() {
    let env = Env::default();
    let id = env.register(BonusVaultContract, ());
    let client = BonusVaultContractClient::new(&env, &id);
    let admin = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);
    client.set_state(&admin, &750, &1000);

    let summary = client.vault_allocation_summary();
    assert_eq!(summary.pending_accrual, 750);
    assert_eq!(summary.release_threshold, 1000);
    assert_eq!(summary.allocated_bps, 7500);
    assert_eq!(summary.headroom, 250);
}

#[test]
fn vault_allocation_summary_unconfigured() {
    let env = Env::default();
    let id = env.register(BonusVaultContract, ());
    let client = BonusVaultContractClient::new(&env, &id);

    let summary = client.vault_allocation_summary();
    assert_eq!(summary.pending_accrual, 0);
    assert_eq!(summary.allocated_bps, 0);
    assert_eq!(summary.headroom, 0);
}

#[test]
fn unlock_window_accessor_happy_path() {
    let env = Env::default();
    let id = env.register(BonusVaultContract, ());
    let client = BonusVaultContractClient::new(&env, &id);
    let admin = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);
    client.set_state(&admin, &800, &1000);

    // Threshold not yet met
    let accessor = client.unlock_window_accessor(&1000);
    assert!(!accessor.unlockable);
    assert_eq!(accessor.shortfall, 200);

    // Threshold exactly met
    let accessor2 = client.unlock_window_accessor(&800);
    assert!(accessor2.unlockable);
    assert_eq!(accessor2.shortfall, 0);
}

#[test]
fn unlock_window_accessor_unconfigured() {
    let env = Env::default();
    let id = env.register(BonusVaultContract, ());
    let client = BonusVaultContractClient::new(&env, &id);

    let accessor = client.unlock_window_accessor(&500);
    assert!(!accessor.unlockable);
    assert_eq!(accessor.pending_accrual, 0);
    assert_eq!(accessor.shortfall, 500);
}
