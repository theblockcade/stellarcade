#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _};
use soroban_sdk::{Env};

#[test]
fn test_ready_check_summary() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, TournamentLobby);
    let client = TournamentLobbyClient::new(&env, &contract_id);

    client.init(&admin);

    let lobby_id = 1u64;
    client.create_lobby(&admin, &lobby_id, &2);

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);

    client.join_lobby(&lobby_id, &player1);
    client.join_lobby(&lobby_id, &player2);

    // Initial state: none ready
    let summary = client.ready_check_summary(&lobby_id);
    assert_eq!(summary.total_players, 2);
    assert_eq!(summary.ready_players, 0);
    assert!(!summary.is_everyone_ready);
    assert_eq!(summary.pending_players.len(), 2);

    // Player 1 ready
    client.set_ready(&lobby_id, &player1, &true);
    let summary = client.ready_check_summary(&lobby_id);
    assert_eq!(summary.ready_players, 1);
    assert!(!summary.is_everyone_ready);
    assert_eq!(summary.pending_players.len(), 1);
    assert_eq!(summary.pending_players.get(0).unwrap(), player2);

    // Both ready
    client.set_ready(&lobby_id, &player2, &true);
    let summary = client.ready_check_summary(&lobby_id);
    assert_eq!(summary.ready_players, 2);
    assert!(summary.is_everyone_ready);
    assert_eq!(summary.pending_players.len(), 0);
}

#[test]
fn test_seat_availability() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, TournamentLobby);
    let client = TournamentLobbyClient::new(&env, &contract_id);

    client.init(&admin);

    let lobby_id = 1u64;
    client.create_lobby(&admin, &lobby_id, &2);

    // Initial state
    let seats = client.seat_availability(&lobby_id);
    assert_eq!(seats.total_seats, 2);
    assert_eq!(seats.occupied_seats, 0);
    assert_eq!(seats.remaining_seats, 2);
    assert!(!seats.is_full);

    // Join 1
    let player1 = Address::generate(&env);
    client.join_lobby(&lobby_id, &player1);
    let seats = client.seat_availability(&lobby_id);
    assert_eq!(seats.occupied_seats, 1);
    assert_eq!(seats.remaining_seats, 1);
    assert!(!seats.is_full);

    // Join 2
    let player2 = Address::generate(&env);
    client.join_lobby(&lobby_id, &player2);
    let seats = client.seat_availability(&lobby_id);
    assert_eq!(seats.occupied_seats, 2);
    assert_eq!(seats.remaining_seats, 0);
    assert!(seats.is_full);
}
