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

#[test]
fn test_vote_window_getter_setter() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, MapRotation);
    let client = MapRotationClient::new(&env, &contract_id);
    env.mock_all_auths();

    client.init(&admin);

    // Default value is 0
    assert_eq!(client.vote_window(), 0);

    // Set vote window (admin only)
    client.set_vote_window(&300);
    assert_eq!(client.vote_window(), 300);
}

#[test]
fn test_map_popularity_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, MapRotation);
    let client = MapRotationClient::new(&env, &contract_id);
    env.mock_all_auths();

    let map1 = Symbol::new(&env, "Dust2");
    let map2 = Symbol::new(&env, "Mirage");

    // Missing map returns empty default snapshot
    let snap_missing = client.map_popularity_snapshot(&map1);
    assert_eq!(snap_missing.votes_received, 0);
    assert_eq!(snap_missing.play_count, 0);
    assert_eq!(snap_missing.rating_bps, 0);

    // Record votes/plays
    client.record_vote(&map1);
    client.record_vote(&map1);
    client.record_play(&map1);
    client.update_rating(&map1, &9500);

    let snap = client.map_popularity_snapshot(&map1);
    assert_eq!(snap.votes_received, 2);
    assert_eq!(snap.play_count, 1);
    assert_eq!(snap.rating_bps, 9500);

    // Verify Mirage remains 0
    let snap_mirage = client.map_popularity_snapshot(&map2);
    assert_eq!(snap_mirage.votes_received, 0);
}
