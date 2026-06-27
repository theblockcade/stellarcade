#![cfg(test)]

use soroban_sdk::{Env, Address, testutils::Address as _};
use crate::{BadgeClaimsV2, BadgeClaimsV2Client};

#[test]
fn test_get_pending_claim_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, BadgeClaimsV2);
    let client = BadgeClaimsV2Client::new(&env, &contract_id);
    let user = Address::generate(&env);

    let snapshot = client.get_pending_claim_snapshot(&user);
    assert_eq!(snapshot.pending_amount, 0);
    assert_eq!(snapshot.is_paused, true);
}

#[test]
fn test_get_rollover_pressure() {
    let env = Env::default();
    let contract_id = env.register_contract(None, BadgeClaimsV2);
    let client = BadgeClaimsV2Client::new(&env, &contract_id);

    let rp = client.get_rollover_pressure();
    assert_eq!(rp.total_pressure, 0);
}

#[test]
fn test_get_validation_delay_accessor() {
    let env = Env::default();
    let contract_id = env.register_contract(None, BadgeClaimsV2);
    let client = BadgeClaimsV2Client::new(&env, &contract_id);
    let user = Address::generate(&env);

    let current_ledger = env.ledger().sequence() as u32;
    let delay_ledger = current_ledger + 100;
    client.set_validation_delay(&user, &delay_ledger);

    let accessor = client.get_validation_delay_accessor(&user);
    assert_eq!(accessor.validation_delay_ledger, delay_ledger);
    assert!(accessor.is_validation_delayed);
    assert!(accessor.ledgers_until_validation > 0);
}

#[test]
fn test_get_validation_delay_accessor_expired() {
    let env = Env::default();
    let contract_id = env.register_contract(None, BadgeClaimsV2);
    let client = BadgeClaimsV2Client::new(&env, &contract_id);
    let user = Address::generate(&env);

    let current_ledger = env.ledger().sequence() as u32;
    let delay_ledger = current_ledger - 10;
    client.set_validation_delay(&user, &delay_ledger);

    let accessor = client.get_validation_delay_accessor(&user);
    assert!(!accessor.is_validation_delayed);
    assert_eq!(accessor.ledgers_until_validation, 0);
}

#[test]
fn test_get_validation_delay_accessor_not_set() {
    let env = Env::default();
    let contract_id = env.register_contract(None, BadgeClaimsV2);
    let client = BadgeClaimsV2Client::new(&env, &contract_id);
    let user = Address::generate(&env);

    let accessor = client.get_validation_delay_accessor(&user);
    assert_eq!(accessor.validation_delay_ledger, 0);
    assert!(!accessor.is_validation_delayed);
    assert_eq!(accessor.ledgers_until_validation, 0);
}
