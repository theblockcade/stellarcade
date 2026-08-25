#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{DynamicBondingCurve, DynamicBondingCurveClient, Error};

const SLOPE: u128 = 2;

fn setup(exponent: u32) -> (Env, DynamicBondingCurveClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DynamicBondingCurve, ());
    let client = DynamicBondingCurveClient::new(&env, &contract_id);
    client.initialize(&SLOPE, &exponent);
    let buyer = Address::generate(&env);
    (env, client, buyer)
}

/// Naive discrete curve cost, used to cross-check the contract math.
fn naive_cost(m: u128, k: u32, supply: u128, amount: u128) -> u128 {
    (supply + 1..=supply + amount).map(|s| m * s.pow(k)).sum()
}

#[test]
fn buy_quote_matches_manual_math() {
    let (_env, client, _buyer) = setup(2);

    // m=2, k=2 from empty supply: costs are 2*1^2=2, 2*2^2=8, 2*3^2=18, ...
    // Deposit 28 affords exactly 3 tokens (2 + 8 + 18 = 28).
    assert_eq!(client.get_buy_quote(&28), 3);
    // One unit short of the fourth token (needs 28 + 32 = 60).
    assert_eq!(client.get_buy_quote(&59), 3);
    assert_eq!(client.get_buy_quote(&60), 4);
    // Not enough for the first token.
    assert_eq!(client.get_buy_quote(&1), 0);
}

#[test]
fn buy_consumes_exact_cost_and_price_rises_monotonically() {
    let (_env, client, buyer) = setup(1);

    // m=2, k=1: token s costs 2s. First 5 tokens cost 2+4+6+8+10 = 30.
    let minted = client.buy_tokens(&buyer, &30, &5);
    assert_eq!(minted, 5);
    assert_eq!(client.get_balance(&buyer), 5);

    let status = client.get_pool_status();
    assert_eq!(status.supply, 5);
    assert_eq!(status.reserve, naive_cost(SLOPE, 1, 0, 5));
    assert_eq!(status.spot_price, 2 * 6);

    // Each subsequent single-token purchase costs strictly more.
    let mut last_price = 0u128;
    for _ in 0..5 {
        let before = client.get_pool_status().reserve;
        client.buy_tokens(&buyer, &client.get_pool_status().spot_price, &1);
        let paid = client.get_pool_status().reserve - before;
        assert!(paid > last_price);
        last_price = paid;
    }
}

#[test]
fn sell_returns_reserve_consistently() {
    let (env, client, buyer) = setup(2);
    let other = Address::generate(&env);

    let cost_first_4 = naive_cost(SLOPE, 2, 0, 4);
    client.buy_tokens(&buyer, &cost_first_4, &4);
    let cost_next_3 = naive_cost(SLOPE, 2, 4, 3);
    client.buy_tokens(&other, &cost_next_3, &3);

    let status = client.get_pool_status();
    assert_eq!(status.supply, 7);
    assert_eq!(status.reserve, cost_first_4 + cost_next_3);

    // Selling the top 3 tokens returns exactly what they cost to mint.
    assert_eq!(client.get_sell_quote(&3), cost_next_3);
    let payout = client.sell_tokens(&other, &3, &cost_next_3);
    assert_eq!(payout, cost_next_3);

    let status = client.get_pool_status();
    assert_eq!(status.supply, 4);
    assert_eq!(status.reserve, cost_first_4);
    assert_eq!(client.get_balance(&other), 0);

    // Round trip: buying then immediately selling is value-neutral.
    let quote = client.get_buy_quote(&1_000);
    let minted = client.buy_tokens(&buyer, &1_000, &quote);
    let reserve_after_buy = client.get_pool_status().reserve;
    let returned = client.sell_tokens(&buyer, &minted, &0);
    assert_eq!(returned, reserve_after_buy - cost_first_4);
    assert_eq!(client.get_pool_status().reserve, cost_first_4);
}

#[test]
fn slippage_guard_aborts_on_price_movement() {
    let (env, client, buyer) = setup(1);
    let frontrunner = Address::generate(&env);

    // Buyer quotes 5 tokens for a deposit of 30 (m=2, k=1).
    let quoted = client.get_buy_quote(&30);
    assert_eq!(quoted, 5);

    // Someone else buys first, moving the curve position.
    client.buy_tokens(&frontrunner, &30, &0);

    // The original quote is now unaffordable: 30 only buys tokens 6..8
    // (12 + 14 = 26, third token needs 16 more).
    assert_eq!(
        client.try_buy_tokens(&buyer, &30, &quoted),
        Err(Ok(Error::SlippageExceeded))
    );
    // Without the guard the trade still executes at the worse rate.
    assert_eq!(client.buy_tokens(&buyer, &30, &0), 2);

    // Sell-side slippage: quote, then demand one unit more than quoted.
    let sell_quote = client.get_sell_quote(&2);
    assert_eq!(
        client.try_sell_tokens(&buyer, &2, &(sell_quote + 1)),
        Err(Ok(Error::SlippageExceeded))
    );
}

#[test]
fn zero_supply_and_dust_edge_cases() {
    let (env, client, buyer) = setup(3);

    let status = client.get_pool_status();
    assert_eq!(status.supply, 0);
    assert_eq!(status.reserve, 0);
    assert_eq!(status.reserve_ratio_bps, 0);
    assert_eq!(status.spot_price, SLOPE); // 2 * 1^3

    // Deposit below the first token's price mints nothing.
    assert_eq!(
        client.try_buy_tokens(&buyer, &1, &0),
        Err(Ok(Error::DepositTooSmall))
    );
    // Zero amounts are rejected outright.
    assert_eq!(
        client.try_buy_tokens(&buyer, &0, &0),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        client.try_sell_tokens(&buyer, &0, &0),
        Err(Ok(Error::InvalidAmount))
    );
    // Selling without a balance is rejected.
    assert_eq!(
        client.try_sell_tokens(&buyer, &1, &0),
        Err(Ok(Error::InsufficientBalance))
    );
    let _ = env;
}

#[test]
fn reserve_ratio_approaches_curve_asymptote() {
    let (_env, client, buyer) = setup(1);

    // For k=1 the reserve ratio tends to 1/2 (5000 bps) from below.
    let cost = naive_cost(SLOPE, 1, 0, 1_000);
    client.buy_tokens(&buyer, &cost, &1_000);
    let status = client.get_pool_status();
    assert_eq!(status.supply, 1_000);
    assert!(status.reserve_ratio_bps > 4_900 && status.reserve_ratio_bps <= 5_000);
}

#[test]
fn extreme_deposit_is_handled_without_overflow() {
    let (_env, client, buyer) = setup(3);

    // A maximal deposit mints the largest amount whose cost still fits in
    // u128 — the doubling search treats overflowing costs as unaffordable.
    let minted = client.buy_tokens(&buyer, &u128::MAX, &1);
    assert!(minted > 0);
    assert_eq!(client.get_balance(&buyer), minted);
    // At this supply the market-cap product overflows u128; the status
    // accessor must surface that as an error, not a panic or a wrap.
    assert_eq!(client.try_get_pool_status(), Err(Ok(Error::MathOverflow)));
    // Quoting further trades must not panic either.
    assert_eq!(client.get_buy_quote(&1), 0);
    assert!(client.get_sell_quote(&1) > 0);
}

#[test]
fn initialize_guards() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DynamicBondingCurve, ());
    let client = DynamicBondingCurveClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    assert_eq!(
        client.try_buy_tokens(&buyer, &10, &0),
        Err(Ok(Error::NotInitialized))
    );
    assert_eq!(client.try_initialize(&0, &1), Err(Ok(Error::InvalidSlope)));
    assert_eq!(
        client.try_initialize(&1, &0),
        Err(Ok(Error::InvalidExponent))
    );
    assert_eq!(
        client.try_initialize(&1, &4),
        Err(Ok(Error::InvalidExponent))
    );
    client.initialize(&SLOPE, &2);
    assert_eq!(
        client.try_initialize(&SLOPE, &2),
        Err(Ok(Error::AlreadyInitialized))
    );
}
