#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _};
use soroban_sdk::{Env, Symbol};

#[test]
fn test_route_imbalance_summary() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, RewardRouter);
    let client = RewardRouterClient::new(&env, &contract_id);

    client.init(&admin);

    let route_id = Symbol::new(&env, "test_route");
    
    // Test empty state
    let summary = client.route_imbalance_summary(&route_id);
    assert_eq!(summary.total_allocated, 0);
    assert_eq!(summary.total_routed, 0);
    assert_eq!(summary.imbalance, 0);
    assert!(summary.is_balanced);

    // Update route
    client.update_route(&admin, &route_id, &1000);
    
    let summary = client.route_imbalance_summary(&route_id);
    assert_eq!(summary.total_allocated, 1000);
    assert_eq!(summary.total_routed, 0);
    assert_eq!(summary.imbalance, 1000);
    assert!(!summary.is_balanced);

    // Route some reward
    client.route_reward(&route_id, &400);
    
    let summary = client.route_imbalance_summary(&route_id);
    assert_eq!(summary.total_allocated, 1000);
    assert_eq!(summary.total_routed, 400);
    assert_eq!(summary.imbalance, 600);
    assert!(!summary.is_balanced);

    // Balance it
    client.route_reward(&route_id, &600);
    let summary = client.route_imbalance_summary(&route_id);
    assert_eq!(summary.imbalance, 0);
    assert!(summary.is_balanced);
}

#[test]
fn test_fallback_bucket() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, RewardRouter);
    let client = RewardRouterClient::new(&env, &contract_id);

    client.init(&admin);

    // Test missing fallback
    assert!(client.fallback_bucket().is_none());

    let bucket_addr = Address::generate(&env);
    client.set_fallback(&admin, &bucket_addr);

    let fallback = client.fallback_bucket().unwrap();
    assert_eq!(fallback.bucket_address, bucket_addr);
    assert_eq!(fallback.total_collected, 0);

    // Route to missing route (should go to fallback)
    let missing_route = Symbol::new(&env, "missing");
    client.route_reward(&missing_route, &500);

    let fallback = client.fallback_bucket().unwrap();
    assert_eq!(fallback.total_collected, 500);
    assert!(fallback.last_fallback_ledger > 0);
}
