//! Unit tests for Cross-Contract Handler.
use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger as _}, Address, Bytes, Env, Symbol};

fn setup(
    env: &Env,
) -> (
    CrossContractHandlerClient<'_>,
    Address,
    Address,
    Address,
    Address,
) {
    let admin = Address::generate(env);
    let registry = Address::generate(env);
    let source = Address::generate(env);
    let target = Address::generate(env);
    let contract_id = env.register(CrossContractHandler, ());
    let client = CrossContractHandlerClient::new(env, &contract_id);
    env.mock_all_auths();
    client.init(&admin, &registry);
    (client, admin, registry, source, target)
}

#[test]
fn test_init_succeeds() {
    let env = Env::default();
    let (_, _, _, _, _) = setup(&env);
}

#[test]
fn test_init_rejects_reinit() {
    let env = Env::default();
    let (client, admin, registry, _, _) = setup(&env);
    env.mock_all_auths();
    let result = client.try_init(&admin, &registry);
    assert!(result.is_err());
}

#[test]
fn test_register_route_returns_route_id() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(
        &admin,
        &source,
        &target,
        &Symbol::new(&env, "handle"),
    );
    assert_eq!(route_id, 1);
}

#[test]
fn test_register_route_increments_route_id() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let s2 = Address::generate(&env);
    let t2 = Address::generate(&env);
    let id1 = client.register_route(&admin, &source, &target, &Symbol::new(&env, "a"));
    let id2 = client.register_route(&admin, &s2, &t2, &Symbol::new(&env, "b"));
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
}

#[test]
fn test_get_route_returns_registered_route() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let selector = Symbol::new(&env, "handle");
    let route_id = client.register_route(&admin, &source, &target, &selector);
    let route = client.get_route(&route_id);
    assert_eq!(route.source_contract, source);
    assert_eq!(route.target_contract, target);
    assert_eq!(route.selector, selector);
}

#[test]
fn test_get_route_not_found() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    let result = client.try_get_route(&999);
    assert!(result.is_err());
}

#[test]
fn test_dispatch_by_source_succeeds() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
}

#[test]
fn test_dispatch_by_admin_succeeds() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&admin, &request_id, &route_id, &payload);
}

#[test]
fn test_dispatch_duplicate_request_id_rejected() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    let result = client.try_dispatch(&source, &request_id, &route_id, &payload);
    assert!(result.is_err());
}

#[test]
fn test_acknowledge_by_target_succeeds() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    let result = Bytes::from_slice(&env, &[4, 5, 6]);
    client.acknowledge(&target, &request_id, &result);
}

#[test]
fn test_acknowledge_already_acknowledged_rejected() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    let result = Bytes::from_slice(&env, &[4, 5, 6]);
    client.acknowledge(&target, &request_id, &result);
    let result2 = client.try_acknowledge(&target, &request_id, &result);
    assert!(result2.is_err());
}

#[test]
fn test_register_route_same_source_target_rejected() {
    let env = Env::default();
    let (client, admin, _, source, _) = setup(&env);
    env.mock_all_auths();
    let result = client.try_register_route(&admin, &source, &source, &Symbol::new(&env, "handle"));
    assert!(result.is_err());
}

#[test]
fn test_get_call_status_pending() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    
    let snapshot = client.get_call_status(&request_id);
    assert_eq!(snapshot.request_id, request_id);
    assert_eq!(snapshot.route_id, route_id);
    match snapshot.status {
        RequestStatus::Pending(rid, p) => {
            assert_eq!(rid, route_id);
            assert_eq!(p, payload);
        }
        _ => panic!("Expected Pending status"),
    }
}

#[test]
fn test_get_call_status_acknowledged() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    
    let result = Bytes::from_slice(&env, &[4, 5, 6]);
    client.acknowledge(&target, &request_id, &result);
    
    let snapshot = client.get_call_status(&request_id);
    assert_eq!(snapshot.request_id, request_id);
    assert_eq!(snapshot.route_id, route_id);
    match snapshot.status {
        RequestStatus::Acknowledged(rid, r) => {
            assert_eq!(rid, route_id);
            assert_eq!(r, result);
        }
        _ => panic!("Expected Acknowledged status"),
    }
}

#[test]
fn test_get_call_status_failed() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    
    let error_info = Bytes::from_slice(&env, &[9, 9, 9]);
    client.mark_failed(&target, &request_id, &error_info);
    
    let snapshot = client.get_call_status(&request_id);
    assert_eq!(snapshot.request_id, request_id);
    assert_eq!(snapshot.route_id, route_id);
    match snapshot.status {
        RequestStatus::Failed(rid, e) => {
            assert_eq!(rid, route_id);
            assert_eq!(e, error_info);
        }
        _ => panic!("Expected Failed status"),
    }
}

#[test]
fn test_get_call_status_not_found() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    let request_id = Symbol::new(&env, "nonexistent");
    let result = client.try_get_call_status(&request_id);
    assert!(result.is_err());
}

#[test]
fn test_mark_failed_by_target_succeeds() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    
    let error_info = Bytes::from_slice(&env, &[9, 9, 9]);
    client.mark_failed(&target, &request_id, &error_info);
}

#[test]
fn test_mark_failed_by_admin_succeeds() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    
    let error_info = Bytes::from_slice(&env, &[9, 9, 9]);
    client.mark_failed(&admin, &request_id, &error_info);
}

#[test]
fn test_mark_failed_already_acknowledged_rejected() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    
    let result = Bytes::from_slice(&env, &[4, 5, 6]);
    client.acknowledge(&target, &request_id, &result);
    
    let error_info = Bytes::from_slice(&env, &[9, 9, 9]);
    let result2 = client.try_mark_failed(&target, &request_id, &error_info);
    assert!(result2.is_err());
}

#[test]
fn test_mark_failed_already_failed_rejected() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    
    let error_info = Bytes::from_slice(&env, &[9, 9, 9]);
    client.mark_failed(&target, &request_id, &error_info);
    
    let error_info2 = Bytes::from_slice(&env, &[8, 8, 8]);
    let result = client.try_mark_failed(&target, &request_id, &error_info2);
    assert!(result.is_err());
}

#[test]
fn test_acknowledge_after_failed_rejected() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();
    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "handle"));
    let request_id = Symbol::new(&env, "req1");
    let payload = Bytes::from_slice(&env, &[1, 2, 3]);
    client.dispatch(&source, &request_id, &route_id, &payload);
    
    let error_info = Bytes::from_slice(&env, &[9, 9, 9]);
    client.mark_failed(&target, &request_id, &error_info);
    
    let result = Bytes::from_slice(&env, &[4, 5, 6]);
    let result2 = client.try_acknowledge(&target, &request_id, &result);
    assert!(result2.is_err());
}

#[test]
fn test_handler_status_snapshot_initialized() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();

    let snapshot = client.handler_status_snapshot();
    assert!(snapshot.configured);
    assert_eq!(snapshot.route_count, 0);
    assert!(snapshot.has_registry);

    client.register_route(&admin, &source, &target, &Symbol::new(&env, "sel"));
    let snapshot2 = client.handler_status_snapshot();
    assert_eq!(snapshot2.route_count, 1);
}

#[test]
fn test_handler_status_snapshot_unconfigured() {
    let env = Env::default();
    let contract_id = env.register(CrossContractHandler, ());
    let client = CrossContractHandlerClient::new(&env, &contract_id);

    let snapshot = client.handler_status_snapshot();
    assert!(!snapshot.configured);
    assert_eq!(snapshot.route_count, 0);
    assert!(!snapshot.has_registry);
}

#[test]
fn test_route_timeout_accessor_not_timed_out() {
    let env = Env::default();
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();

    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "sel"));
    let current = env.ledger().sequence();
    // dispatched just now, timeout = 1000 ledgers => far from timed out
    let accessor = client.route_timeout_accessor(&route_id, &current, &1000u32);
    assert!(accessor.exists);
    assert_eq!(accessor.deadline_ledger, current + 1000);
    assert!(!accessor.timed_out);
    assert_eq!(accessor.current_ledger, current);
}

#[test]
fn test_route_timeout_accessor_timed_out() {
    let env = Env::default();
    env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 0,
        protocol_version: 25,
        sequence_number: 1000,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 1,
        min_persistent_entry_ttl: 1,
        max_entry_ttl: 1_000_000,
    });
    let (client, admin, _, source, target) = setup(&env);
    env.mock_all_auths();

    let route_id = client.register_route(&admin, &source, &target, &Symbol::new(&env, "sel"));
    let current = env.ledger().sequence(); // 1000
    // dispatched at ledger 400, timeout = 100 => deadline = 500, current (1000) > 500 => timed out
    let dispatched_at = 400u32;
    let accessor = client.route_timeout_accessor(&route_id, &dispatched_at, &100u32);
    assert!(accessor.exists);
    assert_eq!(accessor.deadline_ledger, 500);
    assert_eq!(accessor.current_ledger, current);
    assert!(accessor.timed_out);
}

#[test]
fn test_route_timeout_accessor_missing_route() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);

    let accessor = client.route_timeout_accessor(&999u32, &0u32, &100u32);
    assert!(!accessor.exists);
    assert!(!accessor.timed_out);
}
