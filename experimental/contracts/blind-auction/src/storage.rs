//! Storage keys and access helpers for the blind auction contract.

use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::{Auction, BidRecord};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Token,
    FeeBps,
    NextAuctionId,
    Auction(u64),
    Bid(u64, Address),
    Bidders(u64),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_token(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Token)
}

pub fn write_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn read_fee_bps(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0)
}

pub fn write_fee_bps(env: &Env, fee_bps: u32) {
    env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
}

pub fn next_auction_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextAuctionId)
        .unwrap_or(0);
    env.storage()
        .instance()
        .set(&DataKey::NextAuctionId, &(id + 1));
    id
}

pub fn read_auction(env: &Env, id: u64) -> Option<Auction> {
    env.storage().persistent().get(&DataKey::Auction(id))
}

pub fn write_auction(env: &Env, auction: &Auction) {
    let key = DataKey::Auction(auction.id);
    env.storage().persistent().set(&key, auction);
    extend(env, &key);
}

pub fn read_bid(env: &Env, auction_id: u64, bidder: &Address) -> Option<BidRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Bid(auction_id, bidder.clone()))
}

pub fn write_bid(env: &Env, auction_id: u64, bid: &BidRecord) {
    let key = DataKey::Bid(auction_id, bid.bidder.clone());
    env.storage().persistent().set(&key, bid);
    extend(env, &key);
}

pub fn read_bidders(env: &Env, auction_id: u64) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::Bidders(auction_id))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn write_bidders(env: &Env, auction_id: u64, bidders: &Vec<Address>) {
    let key = DataKey::Bidders(auction_id);
    env.storage().persistent().set(&key, bidders);
    extend(env, &key);
}
