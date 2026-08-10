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

fn setup(env: &Env) -> (PlayerRatingClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register_contract(None, PlayerRating);
    let client = PlayerRatingClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin)
}

#[test]
fn test_update_cooldown_getter_setter() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    assert_eq!(client.update_cooldown(), 0);

    client.set_update_cooldown(&admin, &3600);
    assert_eq!(client.update_cooldown(), 3600);
}

#[test]
fn test_rating_distribution_snapshot() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    // Initial state
    let snapshot = client.rating_distribution_snapshot();
    assert_eq!(snapshot.total_players, 0);
    assert_eq!(snapshot.under_1000, 0);
    assert_eq!(snapshot.rating_1000_to_1999, 0);
    assert_eq!(snapshot.rating_2000_and_above, 0);

    // Set distribution
    let new_dist = RatingDistributionSnapshot {
        total_players: 150,
        under_1000: 50,
        rating_1000_to_1999: 80,
        rating_2000_and_above: 20,
    };
    client.set_rating_distribution(&admin, &new_dist);

    let snapshot_updated = client.rating_distribution_snapshot();
    assert_eq!(snapshot_updated.total_players, 150);
    assert_eq!(snapshot_updated.under_1000, 50);
    assert_eq!(snapshot_updated.rating_1000_to_1999, 80);
    assert_eq!(snapshot_updated.rating_2000_and_above, 20);
}