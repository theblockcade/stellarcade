#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, BytesN, Env,
};

use crate::{BlindAuction, BlindAuctionClient, Error};

const START_TS: u64 = 1_000;
const BID_END: u64 = 2_000;
const REVEAL_END: u64 = 3_000;
const FEE_BPS: u32 = 500; // 5%
const RESERVE: i128 = 50;

struct Setup {
    env: Env,
    client: BlindAuctionClient<'static>,
    token: token::Client<'static>,
    seller: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = START_TS);

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());

    let contract_id = env.register(BlindAuction, ());
    let client = BlindAuctionClient::new(&env, &contract_id);
    client.initialize(&sac.address(), &FEE_BPS);

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
        seller,
    }
}

fn fund(s: &Setup, who: &Address, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.token.address).mint(who, &amount);
}

fn salt(env: &Env, fill: u8) -> BytesN<32> {
    BytesN::from_array(env, &[fill; 32])
}

fn commit(s: &Setup, amount: i128, salt: &BytesN<32>) -> BytesN<32> {
    crate::commitment_hash(&s.env, amount, salt)
}

fn create(s: &Setup) -> u64 {
    s.client
        .create_auction(&s.seller, &RESERVE, &BID_END, &REVEAL_END)
}

#[test]
fn multi_bidder_happy_path_highest_bid_wins() {
    let s = setup();
    let a = Address::generate(&s.env);
    let b = Address::generate(&s.env);
    fund(&s, &a, 1_000);
    fund(&s, &b, 1_000);

    let id = create(&s);
    let salt_a = salt(&s.env, 1);
    let salt_b = salt(&s.env, 2);
    s.client.commit_bid(&id, &a, &commit(&s, 100, &salt_a), &200);
    s.client.commit_bid(&id, &b, &commit(&s, 180, &salt_b), &200);

    s.env.ledger().with_mut(|l| l.timestamp = BID_END);
    s.client.reveal_bid(&id, &a, &100, &salt_a);
    s.client.reveal_bid(&id, &b, &180, &salt_b);

    s.env.ledger().with_mut(|l| l.timestamp = REVEAL_END);
    let result = s.client.settle_auction(&id);

    assert_eq!(result.winner, Some(b.clone()));
    assert_eq!(result.winning_bid, 180);
    // 5% fee: seller gets 171, fee 9.
    assert_eq!(result.seller_proceeds, 171);
    assert_eq!(result.fee, 9);
    assert_eq!(s.token.balance(&s.seller), 171);
    // Loser a: deposit 200, bid 100, excess 100 refunded on reveal, remaining 100 refunded on settle.
    assert_eq!(s.token.balance(&a), 1_000);
    // Winner b: deposit 200, bid 180, excess 20 refunded on reveal, 180 stays with contract/seller.
    assert_eq!(s.token.balance(&b), 1_000 - 180);
}

#[test]
fn premature_reveal_is_rejected() {
    let s = setup();
    let bidder = Address::generate(&s.env);
    fund(&s, &bidder, 500);

    let id = create(&s);
    let sl = salt(&s.env, 9);
    s.client.commit_bid(&id, &bidder, &commit(&s, 80, &sl), &100);

    let result = s.client.try_reveal_bid(&id, &bidder, &80, &sl);
    assert_eq!(result, Err(Ok(Error::RevealTooEarly)));
}

#[test]
fn unrevealed_deposits_are_forfeited_on_settle() {
    let s = setup();
    let revealed = Address::generate(&s.env);
    let silent = Address::generate(&s.env);
    fund(&s, &revealed, 500);
    fund(&s, &silent, 500);

    let id = create(&s);
    let sl = salt(&s.env, 3);
    s.client
        .commit_bid(&id, &revealed, &commit(&s, 120, &sl), &150);
    s.client
        .commit_bid(&id, &silent, &commit(&s, 90, &salt(&s.env, 4)), &150);

    s.env.ledger().with_mut(|l| l.timestamp = BID_END);
    s.client.reveal_bid(&id, &revealed, &120, &sl);

    s.env.ledger().with_mut(|l| l.timestamp = REVEAL_END);
    let result = s.client.settle_auction(&id);

    assert_eq!(result.winner, Some(revealed.clone()));
    assert_eq!(result.winning_bid, 120);
    assert_eq!(result.forfeited, 150);
    // Seller: winning proceeds 120 * 95% = 114, plus forfeited 150.
    assert_eq!(s.token.balance(&s.seller), 114 + 150);
    assert_eq!(s.token.balance(&silent), 500 - 150);
}
