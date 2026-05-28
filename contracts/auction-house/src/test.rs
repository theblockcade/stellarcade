#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Env as _};
use soroban_sdk::{Address, Env};

#[test]
fn test_active_lot_summary() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AuctionHouse);
    let client = AuctionHouseClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.init(&admin);

    let summary = client.active_lot_summary();
    assert_eq!(summary.total_active_lots, 0);
    assert_eq!(summary.lots_in_bidding, 0);
    assert_eq!(summary.total_lot_value, 0);
}

#[test]
fn test_bid_window_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AuctionHouse);
    let client = AuctionHouseClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.init(&admin);

    let snapshot = client.bid_window_snapshot();
    assert_eq!(snapshot.window_start, 0);
    assert_eq!(snapshot.window_end, 0);
    assert_eq!(snapshot.active_bids, 0);
    assert_eq!(snapshot.highest_bid, 0);
}