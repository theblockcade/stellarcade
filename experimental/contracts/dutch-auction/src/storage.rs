//! Storage keys and access helpers for the Dutch auction contract.

use soroban_sdk::{contracttype, Address, Env};

use crate::types::DutchAuctionSummary;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    PaymentToken,
    /// Next auction id to be assigned.
    NextAuctionId,
    Auction(u64),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn read_payment_token(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::PaymentToken)
        .unwrap()
}

pub fn read_next_auction_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextAuctionId)
        .unwrap_or(0)
}

pub fn write_next_auction_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextAuctionId, &id);
}

pub fn read_auction(env: &Env, id: u64) -> Option<DutchAuctionSummary> {
    env.storage().persistent().get(&DataKey::Auction(id))
}

pub fn write_auction(env: &Env, id: u64, auction: &DutchAuctionSummary) {
    let key = DataKey::Auction(id);
    env.storage().persistent().set(&key, auction);
    extend(env, &key);
}
