#![cfg(test)]

use soroban_sdk::{testutils::Address as _, testutils::Ledger, token, Address, Env};

use crate::{DutchAuction, DutchAuctionClient, Error};

struct Setup {
    env: Env,
    client: DutchAuctionClient<'static>,
    token: token::Client<'static>,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());

    let contract_id = env.register(DutchAuction, ());
    let client = DutchAuctionClient::new(&env, &contract_id);
    client.initialize(&admin, &sac.address());

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
    }
}

fn fund(s: &Setup, player: &Address, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.token.address).mint(player, &amount);
}

const START_PRICE: i128 = 1_000;
const FLOOR_PRICE: i128 = 100;
const DURATION: u64 = 1_000;

fn create_default_auction(s: &Setup, seller: &Address) -> u64 {
    let start_ts = s.env.ledger().timestamp();
    s.client
        .create_auction(seller, &1, &START_PRICE, &FLOOR_PRICE, &start_ts, &DURATION)
}

#[test]
fn price_at_zero_percent_elapsed_is_start_price() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);

    assert_eq!(s.client.get_current_price(&id), START_PRICE);
}

#[test]
fn price_at_fifty_percent_elapsed_is_midpoint() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);

    s.env.ledger().with_mut(|l| l.timestamp += DURATION / 2);

    // start=1000, floor=100, range=900, 50% decayed = 450 -> price = 550.
    assert_eq!(s.client.get_current_price(&id), 550);
}

#[test]
fn price_at_one_hundred_percent_elapsed_is_floor_price() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);

    s.env.ledger().with_mut(|l| l.timestamp += DURATION);

    assert_eq!(s.client.get_current_price(&id), FLOOR_PRICE);
}

#[test]
fn price_does_not_decay_below_floor_past_expiry() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);

    s.env.ledger().with_mut(|l| l.timestamp += DURATION * 10);

    assert_eq!(s.client.get_current_price(&id), FLOOR_PRICE);
}

#[test]
fn successful_buy_transfers_funds_and_refunds_overpayment() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let buyer = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);
    fund(&s, &buyer, 2_000);

    s.env.ledger().with_mut(|l| l.timestamp += DURATION / 2); // price = 550

    let paid = s.client.buy(&id, &buyer, &2_000);

    // Only the current price is transferred, not max_payment — the buyer's
    // wallet only ever authorizes/moves the actual price, so there is no
    // separate "refund" transfer to make: the unspent 1_450 was simply
    // never taken.
    assert_eq!(paid, 550);
    assert_eq!(s.token.balance(&buyer), 2_000 - 550);
    assert_eq!(s.token.balance(&seller), 550);

    let auction = s.client.get_auction(&id);
    assert!(auction.settled);
    assert_eq!(auction.buyer, Some(buyer));
}

#[test]
fn double_buy_on_finalized_auction_is_rejected() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let buyer1 = Address::generate(&s.env);
    let buyer2 = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);
    fund(&s, &buyer1, 2_000);
    fund(&s, &buyer2, 2_000);

    s.client.buy(&id, &buyer1, &2_000);

    let result = s.client.try_buy(&id, &buyer2, &2_000);
    assert_eq!(result, Err(Ok(Error::AuctionAlreadySettled)));
    // buyer2's funds are untouched.
    assert_eq!(s.token.balance(&buyer2), 2_000);
}

#[test]
fn buy_below_current_price_is_rejected() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let buyer = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);
    fund(&s, &buyer, 2_000);

    let result = s.client.try_buy(&id, &buyer, &(START_PRICE - 1));
    assert_eq!(result, Err(Ok(Error::PaymentTooLow)));
}

#[test]
fn seller_can_cancel_after_expiry() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);

    s.env.ledger().with_mut(|l| l.timestamp += DURATION);
    s.client.cancel_auction(&id, &seller);

    let auction = s.client.get_auction(&id);
    assert!(auction.cancelled);
}

#[test]
fn cancel_before_expiry_is_rejected() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);

    let result = s.client.try_cancel_auction(&id, &seller);
    assert_eq!(result, Err(Ok(Error::AuctionStillActive)));
}

#[test]
fn non_seller_cannot_cancel() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let stranger = Address::generate(&s.env);
    let id = create_default_auction(&s, &seller);

    s.env.ledger().with_mut(|l| l.timestamp += DURATION);

    let result = s.client.try_cancel_auction(&id, &stranger);
    assert_eq!(result, Err(Ok(Error::NotSeller)));
}

#[test]
fn invalid_price_range_is_rejected() {
    let s = setup();
    let seller = Address::generate(&s.env);
    let start_ts = s.env.ledger().timestamp();

    let result = s
        .client
        .try_create_auction(&seller, &1, &100, &200, &start_ts, &DURATION);
    assert_eq!(result, Err(Ok(Error::InvalidPriceRange)));
}
