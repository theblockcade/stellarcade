use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env, String,
};

fn setup(env: &Env) -> (ReserveAuctionClient<'_>, Address, Address, Address) {
    let admin = Address::generate(env);
    let seller = Address::generate(env);
    let bidder = Address::generate(env);
    let contract_id = env.register_contract(None, ReserveAuction);
    let client = ReserveAuctionClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, seller, bidder)
}

#[test]
fn test_auction_snapshot_and_settlement_happy_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, seller, bidder) = setup(&env);
    let asset_label = String::from_str(&env, "creator-pass");

    let auction_id = client.create_auction(&seller, &asset_label, &100, &0, &10);
    client.place_bid(&bidder, &auction_id, &120);

    let live_snapshot = client.auction_snapshot(&auction_id);
    assert!(live_snapshot.exists);
    assert_eq!(live_snapshot.asset_label, Some(asset_label.clone()));
    assert_eq!(live_snapshot.reserve_price, 100);
    assert_eq!(live_snapshot.highest_bid, 120);
    assert_eq!(live_snapshot.highest_bidder, Some(bidder.clone()));
    assert_eq!(live_snapshot.phase, AuctionPhase::Live);
    assert!(live_snapshot.reserve_met);

    env.ledger().set_sequence_number(11);
    let settlement = client.settle_auction(&seller, &auction_id);
    assert!(settlement.reserve_met);
    assert_eq!(settlement.winner, Some(bidder));
    assert_eq!(settlement.winning_bid, 120);
    assert_eq!(settlement.seller_proceeds, 120);

    let settled_snapshot = client.auction_snapshot(&auction_id);
    assert_eq!(settled_snapshot.phase, AuctionPhase::Settled);

    let seller_summary = client.seller_summary(&seller);
    assert!(seller_summary.exists);
    assert_eq!(seller_summary.total_created, 1);
    assert_eq!(seller_summary.active_auction_count, 0);
    assert_eq!(seller_summary.settled_auction_count, 1);
    assert_eq!(seller_summary.reserve_met_count, 1);
    assert_eq!(seller_summary.highest_open_bid, 0);
}

#[test]
fn test_unknown_auction_returns_empty_snapshot() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _seller, _bidder) = setup(&env);

    let snapshot = client.auction_snapshot(&99);
    assert!(!snapshot.exists);
    assert_eq!(snapshot.phase, AuctionPhase::Missing);
    assert_eq!(snapshot.asset_label, None);
    assert_eq!(snapshot.highest_bid, 0);
}

#[test]
fn test_pause_blocks_bid_workflow() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, seller, bidder) = setup(&env);
    let asset_label = String::from_str(&env, "vip-seat");

    let auction_id = client.create_auction(&seller, &asset_label, &50, &0, &20);
    client.set_paused(&true);

    let result = client.try_place_bid(&bidder, &auction_id, &75);
    assert_eq!(result, Err(Ok(Error::ContractPaused)));
}
