#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

struct Setup {
    env: Env,
    client: ReserveManagerClient<'static>,
    admin: Address,
    treasury: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ReserveManager, ());
    let client = ReserveManagerClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);

    // Safety: we transmute to 'static for easier use in test structure
    let client: ReserveManagerClient<'static> = unsafe { core::mem::transmute(client) };

    Setup {
        env,
        client,
        admin,
        treasury,
    }
}

#[test]
fn test_init_and_snapshot() {
    let s = setup();
    s.client.init(&s.admin, &s.treasury);

    let snapshot = s.client.get_full_snapshot();
    assert!(snapshot.config.is_some());
    assert_eq!(snapshot.reserves.len(), 0);
    assert!(!s.client.is_paused());
}

#[test]
fn test_update_and_query_reserve() {
    let s = setup();
    s.client.init(&s.admin, &s.treasury);

    let asset = Address::generate(&s.env);
    s.client.update_reserve(&asset, &1000, &800);

    let state = s.client.get_reserve_for(&asset).unwrap();
    assert_eq!(state.balance, 1000);
    assert_eq!(state.status, ReserveStatus::Healthy);

    let snapshot = s.client.get_full_snapshot();
    assert_eq!(snapshot.reserves.len(), 1);
}

#[test]
fn test_reserve_status_thresholds() {
    let s = setup();
    s.client.init(&s.admin, &s.treasury);

    let asset_a = Address::generate(&s.env); // Healthy
    let asset_b = Address::generate(&s.env); // Below target
    let asset_c = Address::generate(&s.env); // Critical

    s.client.update_reserve(&asset_a, &1000, &1000);
    s.client.update_reserve(&asset_b, &600, &1000);
    s.client.update_reserve(&asset_c, &200, &1000);

    assert_eq!(s.client.get_reserve_for(&asset_a).unwrap().status, ReserveStatus::Healthy);
    assert_eq!(s.client.get_reserve_for(&asset_b).unwrap().status, ReserveStatus::BelowTarget);
    assert_eq!(s.client.get_reserve_for(&asset_c).unwrap().status, ReserveStatus::Critical);
}

#[test]
fn test_paused_blocks_updates() {
    let s = setup();
    s.client.init(&s.admin, &s.treasury);

    s.client.set_pause(&true);
    let asset = Address::generate(&s.env);
    let result = s.client.try_update_reserve(&asset, &100, &100);
    assert!(result.is_err());
}

#[test]
fn test_uninitialized_snapshot() {
    let env = Env::default();
    let contract_id = env.register(ReserveManager, ());
    let client = ReserveManagerClient::new(&env, &contract_id);

    let snapshot = client.get_full_snapshot();
    assert!(snapshot.config.is_none());
    assert_eq!(snapshot.reserves.len(), 0);
}
