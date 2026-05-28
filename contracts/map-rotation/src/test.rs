#![cfg(test)]
use soroban_sdk::{testutils::Address as _, Address, Env, Symbol};

use super::*;

#[test]
fn test_active_map_cycle_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, MapRotation);
    let client = MapRotationClient::new(&env, &contract_id);

    let snapshot = client.active_map_cycle_snapshot();
    assert_eq!(snapshot.current_map, Symbol::new(&env, "none"));
    assert_eq!(snapshot.cycle_start_time, 0);
    assert_eq!(snapshot.players_active, 0);
    assert_eq!(snapshot.total_maps, 0);
}

#[test]
fn test_next_rotation() {
    let env = Env::default();
    let contract_id = env.register_contract(None, MapRotation);
    let client = MapRotationClient::new(&env, &contract_id);

    let rotation = client.next_rotation();
    assert_eq!(rotation.next_map, Symbol::new(&env, "none"));
    assert_eq!(rotation.rotation_time, 0);
    assert_eq!(rotation.time_until_rotation, 0);
    assert_eq!(rotation.queued_maps.len(), 0);
}