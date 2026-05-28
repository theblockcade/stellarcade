#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Env as _};
use soroban_sdk::{Address, Env};

#[test]
fn test_roster_summary() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ClanRegistry);
    let client = ClanRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.init(&admin);

    let summary = client.roster_summary();
    assert_eq!(summary.total_clans, 0);
    assert_eq!(summary.total_members, 0);
    assert_eq!(summary.active_clans, 0);
}

#[test]
fn test_pending_invite_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ClanRegistry);
    let client = ClanRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.init(&admin);

    let snapshot = client.pending_invite_snapshot();
    assert_eq!(snapshot.total_pending_invites, 0);
    assert_eq!(snapshot.expiring_soon, 0);
    assert!(snapshot.pending_addresses.is_empty());
}