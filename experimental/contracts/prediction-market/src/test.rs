#![cfg(test)]

use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env, String};

use crate::{Error, PredictionMarket, PredictionMarketClient};

const COLLATERAL: u128 = 1_000;
const EXPIRY: u64 = 10_000;

fn setup() -> (Env, PredictionMarketClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_000);

    let contract_id = env.register(PredictionMarket, ());
    let client = PredictionMarketClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    (env, client, creator)
}

fn create(client: &PredictionMarketClient, creator: &Address, env: &Env) -> u64 {
    client.create_market(
        creator,
        &String::from_str(env, "Match outcome"),
        &EXPIRY,
        &COLLATERAL,
    )
}

#[test]
fn share_purchase_moves_market_probability_price() {
    let (env, client, creator) = setup();
    let trader = Address::generate(&env);
    let id = create(&client, &creator, &env);

    let (yes0, no0) = client.get_market_prices(&id);
    assert_eq!(yes0 + no0, 10_000);
    assert_eq!(yes0, 5_000);

    client.buy_shares(&id, &trader, &true, &200u128, &0u128);

    let (yes1, no1) = client.get_market_prices(&id);
    assert_eq!(yes1 + no1, 10_000);
    // Buying YES raises the YES price.
    assert!(yes1 > yes0);
    assert!(no1 < no0);
}

#[test]
fn resolve_and_redeem_winning_shares_one_to_one() {
    let (env, client, creator) = setup();
    let trader = Address::generate(&env);
    let id = create(&client, &creator, &env);

    let shares = client.buy_shares(&id, &trader, &true, &100u128, &0u128);
    assert!(shares > 0);

    client.resolve_market(&id, &true, &creator);
    let payout = client.redeem_winnings(&id, &trader);
    assert_eq!(payout, shares);
}

#[test]
fn trade_on_resolved_market_is_rejected() {
    let (env, client, creator) = setup();
    let trader = Address::generate(&env);
    let id = create(&client, &creator, &env);

    client.resolve_market(&id, &true, &creator);

    let buy = client.try_buy_shares(&id, &trader, &true, &50u128, &0u128);
    assert_eq!(buy, Err(Ok(Error::MarketResolved)));

    let sell = client.try_sell_shares(&id, &trader, &true, &1u128, &0u128);
    assert_eq!(sell, Err(Ok(Error::MarketResolved)));
}
