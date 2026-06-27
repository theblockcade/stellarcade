#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
    Address, BytesN, Env, String,
};

struct Setup<'a> {
    _env: Env,
    client: ContractMetadataRegistryClient<'a>,
    _admin: Address,
}

fn setup() -> Setup<'static> {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ContractMetadataRegistry, ());
    let client = ContractMetadataRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.init(&admin);

    let client: ContractMetadataRegistryClient<'static> = unsafe { core::mem::transmute(client) };

    Setup {
        _env: env,
        client,
        _admin: admin,
    }
}

#[test]
fn test_init() {
    let _s = setup();
}

#[test]
fn test_register_and_query() {
    let s = setup();
    let target = Address::generate(&s._env);
    let hash = BytesN::from_array(&s._env, &[1u8; 32]);
    let uri = String::from_str(&s._env, "ipfs://Qm123");

    s.client.register_metadata(&target, &1, &hash, &uri);

    let meta = s.client.metadata_of(&target).unwrap();
    assert_eq!(meta.version, 1);
    assert_eq!(meta.schema_hash, hash);
}

#[test]
fn test_update_and_history() {
    let s = setup();
    let target = Address::generate(&s._env);
    let hash1 = BytesN::from_array(&s._env, &[1u8; 32]);
    let uri1 = String::from_str(&s._env, "ipfs://v1");
    let hash2 = BytesN::from_array(&s._env, &[2u8; 32]);
    let uri2 = String::from_str(&s._env, "ipfs://v2");

    s.client.register_metadata(&target, &1, &hash1, &uri1);

    s._env.ledger().set(LedgerInfo {
        timestamp: 1000,
        protocol_version: 25,
        sequence_number: 10,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1000000,
    });

    s.client.update_metadata(&target, &2, &hash2, &uri2);

    let meta = s.client.metadata_of(&target).unwrap();
    assert_eq!(meta.version, 2);
    assert_eq!(meta.schema_hash, hash2);
    assert_eq!(meta.updated_at, 1000);

    let history = s.client.history(&target);
    assert_eq!(history.len(), 2);
    assert_eq!(history.get(0).unwrap().version, 1);
    assert_eq!(history.get(1).unwrap().version, 2);
}

#[test]
fn test_latest_published_returns_current_metadata() {
    let s = setup();
    let target = Address::generate(&s._env);
    let hash1 = BytesN::from_array(&s._env, &[1u8; 32]);
    let uri1 = String::from_str(&s._env, "ipfs://v1");
    let hash2 = BytesN::from_array(&s._env, &[2u8; 32]);
    let uri2 = String::from_str(&s._env, "ipfs://v2");

    s.client.register_metadata(&target, &1, &hash1, &uri1);
    s.client.update_metadata(&target, &2, &hash2, &uri2);

    let latest = s.client.latest_published(&target).unwrap();
    assert_eq!(latest.version, 2);
    assert_eq!(latest.schema_hash, hash2);
}

#[test]
fn test_latest_published_returns_none_for_unknown_key() {
    let s = setup();
    let unknown = Address::generate(&s._env);
    assert!(s.client.latest_published(&unknown).is_none());
}

#[test]
fn test_history_bounded_returns_limited_entries() {
    let s = setup();
    let target = Address::generate(&s._env);

    let hash1 = BytesN::from_array(&s._env, &[1u8; 32]);
    let hash2 = BytesN::from_array(&s._env, &[2u8; 32]);
    let hash3 = BytesN::from_array(&s._env, &[3u8; 32]);
    let uri = String::from_str(&s._env, "ipfs://doc");

    s.client.register_metadata(&target, &1, &hash1, &uri);
    s.client.update_metadata(&target, &2, &hash2, &uri);
    s.client.update_metadata(&target, &3, &hash3, &uri);

    let bounded = s.client.history_bounded(&target, &2);
    assert_eq!(bounded.len(), 2);
    assert_eq!(bounded.get(0).unwrap().version, 2);
    assert_eq!(bounded.get(1).unwrap().version, 3);
}

#[test]
fn test_history_bounded_returns_empty_for_unknown_key() {
    let s = setup();
    let unknown = Address::generate(&s._env);
    let bounded = s.client.history_bounded(&unknown, &5);
    assert_eq!(bounded.len(), 0);
}

#[test]
fn test_history_bounded_zero_limit_returns_empty() {
    let s = setup();
    let target = Address::generate(&s._env);
    let hash = BytesN::from_array(&s._env, &[1u8; 32]);
    let uri = String::from_str(&s._env, "ipfs://v1");

    s.client.register_metadata(&target, &1, &hash, &uri);

    let bounded = s.client.history_bounded(&target, &0);
    assert_eq!(bounded.len(), 0);
}

#[test]
fn test_is_initialized_returns_true_after_init() {
    let s = setup();
    assert!(s.client.is_initialized());
}

#[test]
fn test_is_initialized_returns_false_before_init() {
    let env = Env::default();
    let contract_id = env.register(ContractMetadataRegistry, ());
    let client = ContractMetadataRegistryClient::new(&env, &contract_id);
    assert!(!client.is_initialized());
}

#[test]
fn test_admin_returns_some_after_init() {
    let s = setup();
    assert!(s.client.admin().is_some());
}

#[test]
fn test_admin_returns_none_before_init() {
    let env = Env::default();
    let contract_id = env.register(ContractMetadataRegistry, ());
    let client = ContractMetadataRegistryClient::new(&env, &contract_id);
    assert!(client.admin().is_none());
}

#[test]
fn test_is_registered_returns_true_after_register() {
    let s = setup();
    let target = Address::generate(&s._env);
    let hash = BytesN::from_array(&s._env, &[1u8; 32]);
    let uri = String::from_str(&s._env, "ipfs://v1");

    s.client.register_metadata(&target, &1, &hash, &uri);

    assert!(s.client.is_registered(&target));
}

#[test]
fn test_is_registered_returns_false_for_unknown() {
    let s = setup();
    let unknown = Address::generate(&s._env);

    assert!(!s.client.is_registered(&unknown));
}

#[test]
fn test_metadata_summary_registered_contract() {
    let s = setup();
    let target = Address::generate(&s._env);
    let hash = BytesN::from_array(&s._env, &[5u8; 32]);
    let uri = String::from_str(&s._env, "ipfs://summary-test");

    s.client.register_metadata(&target, &3, &hash, &uri);

    let summary = s.client.metadata_summary(&target);
    assert!(summary.registered);
    assert_eq!(summary.version, 3);
    assert_eq!(summary.version_count, 3);
    assert_eq!(summary.updated_at, 0);
}

#[test]
fn test_metadata_summary_unregistered_contract() {
    let s = setup();
    let unknown = Address::generate(&s._env);

    let summary = s.client.metadata_summary(&unknown);
    assert!(!summary.registered);
    assert_eq!(summary.version, 0);
    assert_eq!(summary.version_count, 0);
}

#[test]
fn test_list_registered_returns_registered_contracts() {
    let s = setup();
    let target1 = Address::generate(&s._env);
    let target2 = Address::generate(&s._env);
    let hash = BytesN::from_array(&s._env, &[1u8; 32]);
    let uri = String::from_str(&s._env, "ipfs://v1");

    s.client.register_metadata(&target1, &1, &hash, &uri);
    s.client.register_metadata(&target2, &1, &hash, &uri);

    let list = s.client.list_registered(&0, &10);
    assert_eq!(list.len(), 2);
}

#[test]
fn test_list_registered_returns_empty_when_none() {
    let s = setup();
    let list = s.client.list_registered(&0, &10);
    assert_eq!(list.len(), 0);
}

#[test]
fn test_registry_config_after_registrations() {
    let s = setup();
    let target1 = Address::generate(&s._env);
    let target2 = Address::generate(&s._env);
    let hash = BytesN::from_array(&s._env, &[1u8; 32]);
    let uri = String::from_str(&s._env, "ipfs://v1");

    s.client.register_metadata(&target1, &1, &hash, &uri);

    let config = s.client.registry_config();
    assert!(config.initialized);
    assert_eq!(config.registered_contracts, 1);

    s.client.register_metadata(&target2, &1, &hash, &uri);

    let config = s.client.registry_config();
    assert_eq!(config.registered_contracts, 2);
}

#[test]
fn test_registry_config_before_init() {
    let env = Env::default();
    let contract_id = env.register(ContractMetadataRegistry, ());
    let client = ContractMetadataRegistryClient::new(&env, &contract_id);

    let config = client.registry_config();
    assert!(!config.initialized);
    assert_eq!(config.registered_contracts, 0);
}
