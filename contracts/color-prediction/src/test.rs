#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup(
    env: &Env,
) -> (
    ColorPredictionClient<'_>,
    Address,
    Address,
    Address,
    Address,
) {
    let id = env.register(ColorPrediction, ());
    let client = ColorPredictionClient::new(env, &id);
    let admin = Address::generate(env);
    let rng = Address::generate(env);
    let prize_pool = Address::generate(env);
    let balance = Address::generate(env);
    env.mock_all_auths();
    client.init(&admin, &rng, &prize_pool, &balance);
    (client, admin, rng, prize_pool, balance)
}

#[test]
fn test_full_happy_path() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 1;
    let winner = Address::generate(&env);
    let loser = Address::generate(&env);

    client.place_prediction(&winner, &COLOR_RED, &100i128, &game_id);
    client.place_prediction(&loser, &COLOR_BLUE, &100i128, &game_id);

    client.resolve_prediction(&game_id, &COLOR_RED);

    let game = client.get_game(&game_id).unwrap();
    assert_eq!(game.status, GameStatus::Resolved);
    assert_eq!(game.winning_color, COLOR_RED);
    assert_eq!(game.winner_count, 1);
    assert_eq!(game.total_pot, 200);
    assert_eq!(game.player_count, 2);
}

#[test]
fn test_all_winners() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 2;
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let p3 = Address::generate(&env);

    client.place_prediction(&p1, &COLOR_GREEN, &50i128, &game_id);
    client.place_prediction(&p2, &COLOR_GREEN, &50i128, &game_id);
    client.place_prediction(&p3, &COLOR_GREEN, &50i128, &game_id);

    client.resolve_prediction(&game_id, &COLOR_GREEN);

    let game = client.get_game(&game_id).unwrap();
    assert_eq!(game.winner_count, 3);
    assert_eq!(game.total_pot, 150);
}

#[test]
fn test_no_winners() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 3;
    let player = Address::generate(&env);
    client.place_prediction(&player, &COLOR_RED, &200i128, &game_id);

    client.resolve_prediction(&game_id, &COLOR_BLUE);

    let game = client.get_game(&game_id).unwrap();
    assert_eq!(game.winner_count, 0);
    assert_eq!(game.status, GameStatus::Resolved);
}

#[test]
fn test_duplicate_prediction_rejected() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 4;
    let player = Address::generate(&env);
    client.place_prediction(&player, &COLOR_RED, &100i128, &game_id);

    let result = client.try_place_prediction(&player, &COLOR_GREEN, &100i128, &game_id);
    assert!(result.is_err());
}

#[test]
fn test_predict_on_resolved_game_rejected() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 5;
    let p1 = Address::generate(&env);
    client.place_prediction(&p1, &COLOR_RED, &100i128, &game_id);
    client.resolve_prediction(&game_id, &COLOR_RED);

    let late = Address::generate(&env);
    let result = client.try_place_prediction(&late, &COLOR_RED, &100i128, &game_id);
    assert!(result.is_err());
}

#[test]
fn test_double_resolve_rejected() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 6;
    let player = Address::generate(&env);
    client.place_prediction(&player, &COLOR_YELLOW, &10i128, &game_id);
    client.resolve_prediction(&game_id, &COLOR_YELLOW);

    let result = client.try_resolve_prediction(&game_id, &COLOR_YELLOW);
    assert!(result.is_err());
}

#[test]
fn test_invalid_color_on_place_rejected() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 7;
    let player = Address::generate(&env);
    let result = client.try_place_prediction(&player, &99u32, &100i128, &game_id);
    assert!(result.is_err());
}

#[test]
fn test_invalid_color_on_resolve_rejected() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 8;
    let player = Address::generate(&env);
    client.place_prediction(&player, &COLOR_RED, &100i128, &game_id);

    let result = client.try_resolve_prediction(&game_id, &99u32);
    assert!(result.is_err());
}

#[test]
fn test_zero_wager_rejected() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 9;
    let player = Address::generate(&env);
    let result = client.try_place_prediction(&player, &COLOR_RED, &0i128, &game_id);
    assert!(result.is_err());
}

#[test]
fn test_negative_wager_rejected() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 10;
    let player = Address::generate(&env);
    let result = client.try_place_prediction(&player, &COLOR_RED, &-50i128, &game_id);
    assert!(result.is_err());
}

#[test]
fn test_non_admin_cannot_resolve() {
    let env = Env::default();
    let (client, admin, rng, prize_pool, balance) = setup(&env);

    let id2 = env.register(ColorPrediction, ());
    let client2 = ColorPredictionClient::new(&env, &id2);
    env.mock_all_auths();
    client2.init(&admin, &rng, &prize_pool, &balance);

    let game_id: u64 = 11;
    let player = Address::generate(&env);
    client2.place_prediction(&player, &COLOR_RED, &100i128, &game_id);

    let imposter = Address::generate(&env);
    env.mock_auths(&[soroban_sdk::testutils::MockAuth {
        address: &imposter,
        invoke: &soroban_sdk::testutils::MockAuthInvoke {
            contract: &id2,
            fn_name: "resolve_prediction",
            args: soroban_sdk::vec![
                &env,
                soroban_sdk::IntoVal::into_val(&game_id, &env),
                soroban_sdk::IntoVal::into_val(&COLOR_RED, &env),
            ],
            sub_invokes: &[],
        },
    }]);

    let result = client2.try_resolve_prediction(&game_id, &COLOR_RED);
    assert!(result.is_err());

    let _ = client;
}

#[test]
fn test_cannot_init_twice() {
    let env = Env::default();
    let (client, admin, rng, prize_pool, balance) = setup(&env);
    env.mock_all_auths();

    let result = client.try_init(&admin, &rng, &prize_pool, &balance);
    assert!(result.is_err());
}

#[test]
fn test_resolve_nonexistent_game_rejected() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let result = client.try_resolve_prediction(&999u64, &COLOR_RED);
    assert!(result.is_err());
}

#[test]
fn test_get_game_none_for_unknown() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let result = client.get_game(&9999u64);
    assert!(result.is_none());
}

#[test]
fn test_multiple_games_independent() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);

    client.place_prediction(&p1, &COLOR_RED, &100i128, &1u64);
    client.place_prediction(&p2, &COLOR_BLUE, &200i128, &2u64);

    client.resolve_prediction(&1u64, &COLOR_RED);
    client.resolve_prediction(&2u64, &COLOR_GREEN);

    let game1 = client.get_game(&1u64).unwrap();
    let game2 = client.get_game(&2u64).unwrap();

    assert_eq!(game1.winner_count, 1);
    assert_eq!(game1.total_pot, 100);
    assert_eq!(game2.winner_count, 0);
    assert_eq!(game2.total_pot, 200);
}

#[test]
fn test_all_valid_colors_accepted() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    for (game_id, color) in [
        (20u64, COLOR_RED),
        (21u64, COLOR_GREEN),
        (22u64, COLOR_BLUE),
        (23u64, COLOR_YELLOW),
    ] {
        let player = Address::generate(&env);
        client.place_prediction(&player, &color, &10i128, &game_id);
        client.resolve_prediction(&game_id, &color);
        let game = client.get_game(&game_id).unwrap();
        assert_eq!(game.winner_count, 1);
    }
}

#[test]
fn test_is_initialized_false_before_init() {
    let env = Env::default();
    let contract_id = env.register(ColorPrediction, ());
    let client = ColorPredictionClient::new(&env, &contract_id);
    assert_eq!(client.is_initialized(), false);
}

#[test]
fn test_is_initialized_true_after_init() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    assert_eq!(client.is_initialized(), true);
}

#[test]
fn test_get_config_success() {
    let env = Env::default();
    let (client, admin, rng, prize_pool, balance) = setup(&env);

    let config = client.get_config();
    assert!(config.initialized);
    assert_eq!(config.admin.unwrap(), admin);
    assert_eq!(config.rng_contract.unwrap(), rng);
    assert_eq!(config.prize_pool_contract.unwrap(), prize_pool);
    assert_eq!(config.balance_contract.unwrap(), balance);
}

#[test]
fn test_get_config_uninitialized() {
    let env = Env::default();
    let contract_id = env.register(ColorPrediction, ());
    let client = ColorPredictionClient::new(&env, &contract_id);

    let config = client.get_config();
    assert!(!config.initialized);
    assert!(config.admin.is_none());
    assert!(config.rng_contract.is_none());
    assert!(config.prize_pool_contract.is_none());
    assert!(config.balance_contract.is_none());
}

#[test]
fn test_get_prediction_success() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 30;
    let player = Address::generate(&env);
    client.place_prediction(&player, &COLOR_RED, &100i128, &game_id);

    let view = client.get_prediction(&game_id, &player);
    assert!(view.exists);
    assert_eq!(view.game_id, game_id);
    assert_eq!(view.color, COLOR_RED);
    assert_eq!(view.wager, 100);
}

#[test]
fn test_get_prediction_missing() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 31;
    let player = Address::generate(&env);

    let view = client.get_prediction(&game_id, &player);
    assert!(!view.exists);
    assert_eq!(view.color, 0);
    assert_eq!(view.wager, 0);
}

#[test]
fn test_get_players_success() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 32;
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    client.place_prediction(&p1, &COLOR_RED, &10i128, &game_id);
    client.place_prediction(&p2, &COLOR_GREEN, &10i128, &game_id);

    let players = client.get_players(&game_id);
    assert_eq!(players.len(), 2);
}

#[test]
fn test_get_players_empty() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let players = client.get_players(&9999u64);
    assert_eq!(players.len(), 0);
}

#[test]
fn test_player_has_predicted_true() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 33;
    let player = Address::generate(&env);
    client.place_prediction(&player, &COLOR_RED, &10i128, &game_id);

    assert!(client.player_has_predicted(&game_id, &player));
}

#[test]
fn test_player_has_predicted_false() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 34;
    let player = Address::generate(&env);

    assert!(!client.player_has_predicted(&game_id, &player));
}

#[test]
fn test_game_summary_resolved() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let game_id: u64 = 35;
    let player = Address::generate(&env);
    client.place_prediction(&player, &COLOR_RED, &100i128, &game_id);
    client.resolve_prediction(&game_id, &COLOR_RED);

    let summary = client.game_summary(&game_id);
    assert!(summary.exists);
    assert!(summary.resolved);
    assert_eq!(summary.game_id, game_id);
    assert_eq!(summary.total_pot, 100);
    assert_eq!(summary.winner_count, 1);
    assert_eq!(summary.player_count, 1);
    assert_eq!(summary.winning_color, COLOR_RED);
}

#[test]
fn test_game_summary_missing() {
    let env = Env::default();
    let (client, _, _, _, _) = setup(&env);
    env.mock_all_auths();

    let summary = client.game_summary(&9999u64);
    assert!(!summary.exists);
    assert!(!summary.resolved);
    assert_eq!(summary.game_id, 9999);
    assert_eq!(summary.total_pot, 0);
    assert_eq!(summary.winner_count, 0);
    assert_eq!(summary.player_count, 0);
}
