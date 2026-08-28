//! Stellarcade Dutch Auction Contract (experimental)
//!
//! A descending-price auction for a single item (`token_id`, an opaque
//! identifier for whatever is being sold — e.g. a limited arcade pass).
//! Price starts at `start_price` and decays linearly to `floor_price` over
//! `duration_sec`, then holds at the floor. The first buyer to pay at least
//! the current price wins instantly; any overpayment is refunded.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, Env};

pub use types::DutchAuctionSummary;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidPriceRange = 3,
    InvalidDuration = 4,
    AuctionNotFound = 5,
    AuctionAlreadySettled = 6,
    AuctionAlreadyCancelled = 7,
    AuctionStillActive = 8,
    PaymentTooLow = 9,
    NotSeller = 10,
    MathOverflow = 11,
}

#[contract]
pub struct DutchAuction;

#[contractimpl]
impl DutchAuction {
    /// One-time setup: admin and the token buyers pay in.
    pub fn initialize(env: Env, admin: Address, payment_token: Address) -> Result<(), Error> {
        if storage::read_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        env.storage()
            .instance()
            .set(&storage::DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&storage::DataKey::PaymentToken, &payment_token);
        Ok(())
    }

    /// Create a new descending-price auction. Returns the new auction's id.
    pub fn create_auction(
        env: Env,
        seller: Address,
        token_id: u64,
        start_price: i128,
        floor_price: i128,
        start_ts: u64,
        duration_sec: u64,
    ) -> Result<u64, Error> {
        seller.require_auth();
        if storage::read_admin(&env).is_none() {
            return Err(Error::NotInitialized);
        }
        if floor_price < 0 || start_price < floor_price {
            return Err(Error::InvalidPriceRange);
        }
        if duration_sec == 0 {
            return Err(Error::InvalidDuration);
        }

        let id = storage::read_next_auction_id(&env);
        storage::write_next_auction_id(&env, id + 1);

        let auction = DutchAuctionSummary {
            id,
            seller,
            token_id,
            start_price,
            floor_price,
            start_ts,
            duration_sec,
            settled: false,
            cancelled: false,
            buyer: None,
        };
        storage::write_auction(&env, id, &auction);
        Ok(id)
    }

    /// Buy at the current price. `max_payment` caps what the buyer is
    /// willing to pay (protects against the price rising between building
    /// and submitting the transaction, though this contract's price only
    /// ever falls). Any amount above the current price is refunded.
    /// Returns the amount actually paid.
    pub fn buy(env: Env, auction_id: u64, buyer: Address, max_payment: i128) -> Result<i128, Error> {
        buyer.require_auth();
        let mut auction = storage::read_auction(&env, auction_id).ok_or(Error::AuctionNotFound)?;
        if auction.settled {
            return Err(Error::AuctionAlreadySettled);
        }
        if auction.cancelled {
            return Err(Error::AuctionAlreadyCancelled);
        }

        let price = current_price(&env, &auction);
        if max_payment < price {
            return Err(Error::PaymentTooLow);
        }

        let token_client = token::Client::new(&env, &storage::read_payment_token(&env));
        token_client.transfer(&buyer, &auction.seller, &price);

        auction.settled = true;
        auction.buyer = Some(buyer);
        storage::write_auction(&env, auction_id, &auction);

        Ok(price)
    }

    /// Cancel an unsold auction after it has fully decayed to the floor
    /// price for at least `duration_sec` (i.e. the auction has expired).
    /// Only the seller may cancel.
    pub fn cancel_auction(env: Env, auction_id: u64, seller: Address) -> Result<(), Error> {
        seller.require_auth();
        let mut auction = storage::read_auction(&env, auction_id).ok_or(Error::AuctionNotFound)?;
        if auction.seller != seller {
            return Err(Error::NotSeller);
        }
        if auction.settled {
            return Err(Error::AuctionAlreadySettled);
        }
        if auction.cancelled {
            return Err(Error::AuctionAlreadyCancelled);
        }

        let now = env.ledger().timestamp();
        let expires_at = auction
            .start_ts
            .checked_add(auction.duration_sec)
            .ok_or(Error::MathOverflow)?;
        if now < expires_at {
            return Err(Error::AuctionStillActive);
        }

        auction.cancelled = true;
        storage::write_auction(&env, auction_id, &auction);
        Ok(())
    }

    /// The current price of an active auction.
    pub fn get_current_price(env: Env, auction_id: u64) -> Result<i128, Error> {
        let auction = storage::read_auction(&env, auction_id).ok_or(Error::AuctionNotFound)?;
        Ok(current_price(&env, &auction))
    }

    /// Full auction state.
    pub fn get_auction(env: Env, auction_id: u64) -> Result<DutchAuctionSummary, Error> {
        storage::read_auction(&env, auction_id).ok_or(Error::AuctionNotFound)
    }
}

/// `price(now) = max(floor, start_price - ((start_price - floor) * elapsed) / duration)`,
/// clamped so price never exceeds `start_price` before `start_ts` and never
/// drops below `floor_price` after the auction has fully decayed.
fn current_price(env: &Env, auction: &DutchAuctionSummary) -> i128 {
    let now = env.ledger().timestamp();
    if now <= auction.start_ts {
        return auction.start_price;
    }

    let elapsed = now - auction.start_ts;
    if elapsed >= auction.duration_sec {
        return auction.floor_price;
    }

    let price_range = auction.start_price - auction.floor_price;
    let decayed = (price_range * elapsed as i128) / auction.duration_sec as i128;
    auction.start_price - decayed
}
