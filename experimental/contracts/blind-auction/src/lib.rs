//! Stellarcade Blind Auction Contract (experimental)
//!
//! Sealed-bid auction: bidders commit `sha256(bid_amount || salt)` with a
//! deposit during the bidding window, reveal the plaintext after bidding
//! closes, and settlement pays the seller the highest valid bid minus fee,
//! refunds losing revealed bids, and forfeits unrevealed (and invalid)
//! deposits to the seller/auctioneer.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, Bytes, BytesN, Env};

pub use types::{AuctionResult, AuctionStage, AuctionSummary, BidStatus};

pub const MAX_FEE_BPS: u32 = 1_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    FeeTooHigh = 3,
    InvalidReserve = 4,
    InvalidWindow = 5,
    AuctionNotFound = 6,
    BiddingClosed = 7,
    AlreadyBid = 8,
    InvalidDeposit = 9,
    RevealTooEarly = 10,
    RevealClosed = 11,
    NoCommitment = 12,
    AlreadyRevealed = 13,
    SettleTooEarly = 14,
    AlreadySettled = 15,
}

#[contract]
pub struct BlindAuction;

#[contractimpl]
impl BlindAuction {
    /// One-time setup: payment token and protocol fee in basis points.
    pub fn initialize(env: Env, token: Address, fee_bps: u32) -> Result<(), Error> {
        if storage::read_token(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        if fee_bps > MAX_FEE_BPS {
            return Err(Error::FeeTooHigh);
        }
        storage::write_token(&env, &token);
        storage::write_fee_bps(&env, fee_bps);
        Ok(())
    }

    pub fn create_auction(
        env: Env,
        seller: Address,
        reserve_price: i128,
        bidding_end_ts: u64,
        reveal_end_ts: u64,
    ) -> Result<u64, Error> {
        seller.require_auth();
        if storage::read_token(&env).is_none() {
            return Err(Error::NotInitialized);
        }
        if reserve_price < 0 {
            return Err(Error::InvalidReserve);
        }
        let now = env.ledger().timestamp();
        if bidding_end_ts <= now || reveal_end_ts <= bidding_end_ts {
            return Err(Error::InvalidWindow);
        }

        let id = storage::next_auction_id(&env);
        storage::write_auction(
            &env,
            &types::Auction {
                id,
                seller,
                reserve_price,
                bidding_end_ts,
                reveal_end_ts,
                settled: false,
            },
        );
        Ok(id)
    }

    pub fn commit_bid(
        env: Env,
        auction_id: u64,
        bidder: Address,
        commitment: BytesN<32>,
        deposit_amount: i128,
    ) -> Result<(), Error> {
        bidder.require_auth();
        let auction = storage::read_auction(&env, auction_id).ok_or(Error::AuctionNotFound)?;
        if auction.settled {
            return Err(Error::AlreadySettled);
        }
        if env.ledger().timestamp() >= auction.bidding_end_ts {
            return Err(Error::BiddingClosed);
        }
        if deposit_amount <= 0 {
            return Err(Error::InvalidDeposit);
        }
        if storage::read_bid(&env, auction_id, &bidder).is_some() {
            return Err(Error::AlreadyBid);
        }

        let token = storage::read_token(&env).ok_or(Error::NotInitialized)?;
        token::Client::new(&env, &token).transfer(
            &bidder,
            &env.current_contract_address(),
            &deposit_amount,
        );

        storage::write_bid(
            &env,
            auction_id,
            &types::BidRecord {
                bidder: bidder.clone(),
                commitment,
                deposit: deposit_amount,
                bid_amount: 0,
                status: BidStatus::Committed,
            },
        );
        let mut bidders = storage::read_bidders(&env, auction_id);
        bidders.push_back(bidder);
        storage::write_bidders(&env, auction_id, &bidders);
        Ok(())
    }

    pub fn reveal_bid(
        env: Env,
        auction_id: u64,
        bidder: Address,
        bid_amount: i128,
        salt: BytesN<32>,
    ) -> Result<(), Error> {
        bidder.require_auth();
        let auction = storage::read_auction(&env, auction_id).ok_or(Error::AuctionNotFound)?;
        if auction.settled {
            return Err(Error::AlreadySettled);
        }
        let now = env.ledger().timestamp();
        if now < auction.bidding_end_ts {
            return Err(Error::RevealTooEarly);
        }
        if now >= auction.reveal_end_ts {
            return Err(Error::RevealClosed);
        }

        let mut bid = storage::read_bid(&env, auction_id, &bidder).ok_or(Error::NoCommitment)?;
        if bid.status != BidStatus::Committed {
            return Err(Error::AlreadyRevealed);
        }

        let expected = commitment_hash(&env, bid_amount, &salt);
        let token = storage::read_token(&env).ok_or(Error::NotInitialized)?;
        let token_client = token::Client::new(&env, &token);
        let contract = env.current_contract_address();

        // Invalid hash, over-deposit bid, or non-positive amount: forfeit.
        if expected != bid.commitment || bid_amount <= 0 || bid_amount > bid.deposit {
            bid.status = BidStatus::Invalid;
            storage::write_bid(&env, auction_id, &bid);
            return Ok(());
        }

        let excess = bid.deposit - bid_amount;
        if excess > 0 {
            token_client.transfer(&contract, &bidder, &excess);
        }
        bid.bid_amount = bid_amount;
        bid.deposit = bid_amount;
        bid.status = BidStatus::Revealed;
        storage::write_bid(&env, auction_id, &bid);
        Ok(())
    }

    pub fn settle_auction(env: Env, auction_id: u64) -> Result<AuctionResult, Error> {
        let mut auction = storage::read_auction(&env, auction_id).ok_or(Error::AuctionNotFound)?;
        if auction.settled {
            return Err(Error::AlreadySettled);
        }
        if env.ledger().timestamp() < auction.reveal_end_ts {
            return Err(Error::SettleTooEarly);
        }

        let token = storage::read_token(&env).ok_or(Error::NotInitialized)?;
        let token_client = token::Client::new(&env, &token);
        let contract = env.current_contract_address();
        let bidders = storage::read_bidders(&env, auction_id);

        let mut winner: Option<Address> = None;
        let mut winning_bid: i128 = auction.reserve_price;
        let mut has_winner = false;
        let mut forfeited: i128 = 0;

        for bidder in bidders.iter() {
            let bid = storage::read_bid(&env, auction_id, &bidder).unwrap();
            match bid.status {
                BidStatus::Revealed => {
                    if bid.bid_amount >= auction.reserve_price
                        && (!has_winner || bid.bid_amount > winning_bid)
                    {
                        winner = Some(bid.bidder);
                        winning_bid = bid.bid_amount;
                        has_winner = true;
                    }
                }
                BidStatus::Committed | BidStatus::Invalid => {
                    forfeited += bid.deposit;
                }
            }
        }

        let (seller_proceeds, fee) = if has_winner {
            let fee_bps = storage::read_fee_bps(&env) as i128;
            let fee = winning_bid * fee_bps / 10_000;
            (winning_bid - fee, fee)
        } else {
            (0, 0)
        };

        for bidder in bidders.iter() {
            let bid = storage::read_bid(&env, auction_id, &bidder).unwrap();
            match bid.status {
                BidStatus::Revealed => {
                    let is_winner = winner.as_ref() == Some(&bid.bidder);
                    if is_winner {
                        if seller_proceeds > 0 {
                            token_client.transfer(&contract, &auction.seller, &seller_proceeds);
                        }
                    } else if bid.deposit > 0 {
                        token_client.transfer(&contract, &bid.bidder, &bid.deposit);
                    }
                }
                BidStatus::Committed | BidStatus::Invalid => {
                    if bid.deposit > 0 {
                        token_client.transfer(&contract, &auction.seller, &bid.deposit);
                    }
                }
            }
        }

        auction.settled = true;
        storage::write_auction(&env, &auction);

        Ok(AuctionResult {
            auction_id,
            winner,
            winning_bid: if has_winner { winning_bid } else { 0 },
            seller_proceeds,
            fee,
            forfeited,
        })
    }

    pub fn get_auction_state(env: Env, auction_id: u64) -> Result<AuctionSummary, Error> {
        let auction = storage::read_auction(&env, auction_id).ok_or(Error::AuctionNotFound)?;
        let bidders = storage::read_bidders(&env, auction_id);
        let mut highest_bid: i128 = 0;
        for bidder in bidders.iter() {
            if let Some(bid) = storage::read_bid(&env, auction_id, &bidder) {
                if bid.status == BidStatus::Revealed && bid.bid_amount > highest_bid {
                    highest_bid = bid.bid_amount;
                }
            }
        }
        Ok(AuctionSummary {
            id: auction.id,
            seller: auction.seller,
            reserve_price: auction.reserve_price,
            bidding_end_ts: auction.bidding_end_ts,
            reveal_end_ts: auction.reveal_end_ts,
            stage: stage(&env, &auction),
            highest_bid,
            total_bids: bidders.len(),
            settled: auction.settled,
        })
    }
}

fn stage(env: &Env, auction: &types::Auction) -> AuctionStage {
    if auction.settled {
        return AuctionStage::Settled;
    }
    let now = env.ledger().timestamp();
    if now < auction.bidding_end_ts {
        AuctionStage::Bidding
    } else {
        AuctionStage::Reveal
    }
}

/// `sha256(bid_amount.to_be_bytes() || salt)`.
pub fn commitment_hash(env: &Env, bid_amount: i128, salt: &BytesN<32>) -> BytesN<32> {
    let mut preimage = Bytes::new(env);
    preimage.extend_from_array(&bid_amount.to_be_bytes());
    preimage.extend_from_array(&salt.to_array());
    env.crypto().sha256(&preimage).to_bytes()
}
