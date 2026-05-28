#![cfg(test)]
use soroban_sdk::{testutils::Address as _, Address, Env};

use super::*;

#[test]
fn test_volatility_summary_empty() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PlayerRating);
    let client = PlayerRatingClient::new(&env, &contract_id);
    let player = Address::generate(&env);

    let summary = client.volatility_summary(&player);
    assert_eq!(summary.player, player);
    assert!(!summary.exists);
    assert_eq!(summary.current_volatility, 0);
    assert_eq!(summary.volatility_trend, 0);
    assert_eq!(summary.games_played, 0);
}

#[test]
fn test_recent_adjustment_snapshot_empty() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PlayerRating);
    let client = PlayerRatingClient::new(&env, &contract_id);
    let player = Address::generate(&env);

    let snapshot = client.recent_adjustment_snapshot(&player);
    assert_eq!(snapshot.player, player);
    assert!(!snapshot.exists);
    assert_eq!(snapshot.last_adjustment, 0);
    assert_eq!(snapshot.adjustment_count, 0);
    assert_eq!(snapshot.recent_games.len(), 0);
}