use soroban_sdk::{Address, Env};

use crate::{
    types::{ReserveAuctionLot, SellerAuctionStats},
    DataKey, BUMP_AMOUNT, LIFETIME_THRESHOLD,
};

pub fn get_next_auction_id(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::NextAuctionId).unwrap_or(0)
}

pub fn set_next_auction_id(env: &Env, next_auction_id: u64) {
    env.storage().instance().set(&DataKey::NextAuctionId, &next_auction_id);
}

pub fn get_auction(env: &Env, auction_id: u64) -> Option<ReserveAuctionLot> {
    let key = DataKey::Auction(auction_id);
    let value = env.storage().persistent().get(&key);
    if value.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    value
}

pub fn set_auction(env: &Env, auction: &ReserveAuctionLot) {
    let key = DataKey::Auction(auction.auction_id);
    env.storage().persistent().set(&key, auction);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}

pub fn get_seller_stats(env: &Env, seller: &Address) -> SellerAuctionStats {
    let key = DataKey::SellerStats(seller.clone());
    let value = env.storage().persistent().get(&key);
    if value.is_some() {
        env.storage()
            .persistent()
            .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
    value.unwrap_or(SellerAuctionStats {
        total_created: 0,
        active_auction_count: 0,
        settled_auction_count: 0,
        reserve_met_count: 0,
    })
}

pub fn set_seller_stats(env: &Env, seller: &Address, stats: &SellerAuctionStats) {
    let key = DataKey::SellerStats(seller.clone());
    env.storage().persistent().set(&key, stats);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}
