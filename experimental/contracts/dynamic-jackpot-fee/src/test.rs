use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{DynamicJackpotFee, DynamicJackpotFeeClient, Error};

fn setup() -> (Env, DynamicJackpotFeeClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DynamicJackpotFee, ());
    let client = DynamicJackpotFeeClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    (env, client)
}

#[test]
fn low_volume_returns_max_fee() {
    let (env, client) = setup();
    let game = Address::generate(&env);

    let fee_bps = client.get_current_fee_bps();
    assert_eq!(fee_bps, 250);

    let summary = client.route_wager(&game, &10_000i128);
    assert_eq!(summary.fee_bps, 250);
    assert_eq!(summary.fee_amount, 250);
}

#[test]
fn high_volume_lowers_fee_to_minimum() {
    let (env, client) = setup();
    let game = Address::generate(&env);

    for _ in 0..100 {
        client.route_wager(&game, &10_000i128);
    }

    let fee_bps = client.get_current_fee_bps();
    assert_eq!(fee_bps, 100);
}

#[test]
fn split_transfer_accuracy() {
    let (env, client) = setup();
    let game = Address::generate(&env);

    let summary = client.route_wager(&game, &10_000i128);
    assert_eq!(
        summary.fee_amount,
        summary.jackpot_amount + summary.pool_amount
    );
    assert!(summary.jackpot_amount > 0);
    assert!(summary.pool_amount > 0);
}

#[test]
fn invalid_wager_rejected() {
    let (env, client) = setup();
    let game = Address::generate(&env);

    let result = client.try_route_wager(&game, &0i128);
    assert_eq!(result, Err(Ok(Error::InvalidWager)));

    let result = client.try_route_wager(&game, &-100i128);
    assert_eq!(result, Err(Ok(Error::InvalidWager)));
}

#[test]
fn volume_accumulates_across_wagers() {
    let (env, client) = setup();
    let game = Address::generate(&env);

    client.route_wager(&game, &5_000i128);
    let vol1 = client.get_24h_volume();
    assert_eq!(vol1, 5_000);

    client.route_wager(&game, &5_000i128);
    let vol2 = client.get_24h_volume();
    assert_eq!(vol2, 10_000);
}
