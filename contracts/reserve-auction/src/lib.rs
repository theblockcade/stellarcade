#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, String};

pub use types::{
    AuctionPhase, ReserveAuctionLot, ReserveAuctionSnapshot, SellerAuctionStats,
    SellerAuctionSummary, SettlementOutcome,
};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    GlobalPaused,
    NextAuctionId,
    Auction(u64),
    SellerStats(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    ContractPaused = 4,
    InvalidReservePrice = 5,
    InvalidAuctionWindow = 6,
    InvalidAssetLabel = 7,
    AuctionNotFound = 8,
    AuctionNotLive = 9,
    BidTooLow = 10,
    AuctionNotEnded = 11,
    AlreadySettled = 12,
    SellerMismatch = 13,
}

#[contract]
pub struct ReserveAuction;

#[contractimpl]
impl ReserveAuction {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GlobalPaused, &false);
        env.storage().instance().set(&DataKey::NextAuctionId, &0_u64);
        Ok(())
    }

    pub fn set_paused(env: Env, paused: bool) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&DataKey::GlobalPaused, &paused);
        Ok(())
    }

    pub fn create_auction(
        env: Env,
        seller: Address,
        asset_label: String,
        reserve_price: i128,
        start_ledger: u32,
        end_ledger: u32,
    ) -> Result<u64, Error> {
        Self::read_admin(&env)?;
        Self::ensure_not_paused(&env)?;
        seller.require_auth();

        if reserve_price <= 0 {
            return Err(Error::InvalidReservePrice);
        }
        if asset_label.len() == 0 {
            return Err(Error::InvalidAssetLabel);
        }
        if start_ledger >= end_ledger {
            return Err(Error::InvalidAuctionWindow);
        }

        let auction_id = storage::get_next_auction_id(&env);
        storage::set_auction(
            &env,
            &ReserveAuctionLot {
                auction_id,
                seller: seller.clone(),
                asset_label,
                reserve_price,
                start_ledger,
                end_ledger,
                highest_bid: 0,
                highest_bidder: None,
                bid_count: 0,
                settled: false,
            },
        );
        storage::set_next_auction_id(&env, auction_id.saturating_add(1));

        let mut stats = storage::get_seller_stats(&env, &seller);
        stats.total_created = stats.total_created.saturating_add(1);
        stats.active_auction_count = stats.active_auction_count.saturating_add(1);
        storage::set_seller_stats(&env, &seller, &stats);

        Ok(auction_id)
    }

    pub fn place_bid(
        env: Env,
        bidder: Address,
        auction_id: u64,
        amount: i128,
    ) -> Result<(), Error> {
        Self::read_admin(&env)?;
        Self::ensure_not_paused(&env)?;
        bidder.require_auth();

        if amount <= 0 {
            return Err(Error::BidTooLow);
        }

        let mut auction = storage::get_auction(&env, auction_id).ok_or(Error::AuctionNotFound)?;
        if auction.settled {
            return Err(Error::AlreadySettled);
        }
        if Self::phase_for(&env, &auction) != AuctionPhase::Live {
            return Err(Error::AuctionNotLive);
        }
        if amount <= auction.highest_bid {
            return Err(Error::BidTooLow);
        }

        auction.highest_bid = amount;
        auction.highest_bidder = Some(bidder);
        auction.bid_count = auction.bid_count.saturating_add(1);
        storage::set_auction(&env, &auction);
        Ok(())
    }

    pub fn settle_auction(
        env: Env,
        seller: Address,
        auction_id: u64,
    ) -> Result<SettlementOutcome, Error> {
        Self::read_admin(&env)?;
        Self::ensure_not_paused(&env)?;
        seller.require_auth();

        let mut auction = storage::get_auction(&env, auction_id).ok_or(Error::AuctionNotFound)?;
        if auction.seller != seller {
            return Err(Error::SellerMismatch);
        }
        if auction.settled {
            return Err(Error::AlreadySettled);
        }
        if Self::phase_for(&env, &auction) != AuctionPhase::Ended {
            return Err(Error::AuctionNotEnded);
        }

        auction.settled = true;
        storage::set_auction(&env, &auction);

        let reserve_met = auction.highest_bid >= auction.reserve_price;
        let mut stats = storage::get_seller_stats(&env, &seller);
        stats.active_auction_count = stats.active_auction_count.saturating_sub(1);
        stats.settled_auction_count = stats.settled_auction_count.saturating_add(1);
        if reserve_met {
            stats.reserve_met_count = stats.reserve_met_count.saturating_add(1);
        }
        storage::set_seller_stats(&env, &seller, &stats);

        Ok(SettlementOutcome {
            auction_id,
            seller,
            winner: if reserve_met {
                auction.highest_bidder.clone()
            } else {
                None
            },
            reserve_met,
            settled: true,
            winning_bid: auction.highest_bid,
            seller_proceeds: if reserve_met { auction.highest_bid } else { 0 },
        })
    }

    pub fn auction_snapshot(env: Env, auction_id: u64) -> ReserveAuctionSnapshot {
        let paused = Self::is_paused(&env);

        let Some(auction) = storage::get_auction(&env, auction_id) else {
            return ReserveAuctionSnapshot {
                auction_id,
                exists: false,
                paused,
                seller: None,
                asset_label: None,
                reserve_price: 0,
                highest_bid: 0,
                highest_bidder: None,
                start_ledger: 0,
                end_ledger: 0,
                bid_count: 0,
                reserve_met: false,
                phase: AuctionPhase::Missing,
            };
        };

        ReserveAuctionSnapshot {
            auction_id,
            exists: true,
            paused,
            seller: Some(auction.seller.clone()),
            asset_label: Some(auction.asset_label.clone()),
            reserve_price: auction.reserve_price,
            highest_bid: auction.highest_bid,
            highest_bidder: auction.highest_bidder.clone(),
            start_ledger: auction.start_ledger,
            end_ledger: auction.end_ledger,
            bid_count: auction.bid_count,
            reserve_met: auction.highest_bid >= auction.reserve_price,
            phase: Self::phase_for(&env, &auction),
        }
    }

    pub fn seller_summary(env: Env, seller: Address) -> SellerAuctionSummary {
        let paused = Self::is_paused(&env);
        let stats = storage::get_seller_stats(&env, &seller);
        let next_auction_id = storage::get_next_auction_id(&env);
        let mut highest_open_bid = 0_i128;

        for auction_id in 0..next_auction_id {
            if let Some(auction) = storage::get_auction(&env, auction_id) {
                if auction.seller == seller && !auction.settled {
                    let phase = Self::phase_for(&env, &auction);
                    if phase == AuctionPhase::Pending || phase == AuctionPhase::Live {
                        if auction.highest_bid > highest_open_bid {
                            highest_open_bid = auction.highest_bid;
                        }
                    }
                }
            }
        }

        let exists = stats.total_created > 0;
        SellerAuctionSummary {
            seller,
            exists,
            paused,
            total_created: stats.total_created,
            active_auction_count: stats.active_auction_count,
            settled_auction_count: stats.settled_auction_count,
            reserve_met_count: stats.reserve_met_count,
            highest_open_bid,
        }
    }

    fn read_admin(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    fn require_admin(env: &Env) -> Result<Address, Error> {
        let admin = Self::read_admin(env)?;
        admin.require_auth();
        Ok(admin)
    }

    fn is_paused(env: &Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::GlobalPaused)
            .unwrap_or(false)
    }

    fn ensure_not_paused(env: &Env) -> Result<(), Error> {
        if Self::is_paused(env) {
            return Err(Error::ContractPaused);
        }
        Ok(())
    }

    fn phase_for(env: &Env, auction: &ReserveAuctionLot) -> AuctionPhase {
        if auction.settled {
            return AuctionPhase::Settled;
        }

        let current_ledger = env.ledger().sequence();
        if current_ledger < auction.start_ledger {
            AuctionPhase::Pending
        } else if current_ledger <= auction.end_ledger {
            AuctionPhase::Live
        } else {
            AuctionPhase::Ended
        }
    }
}

#[cfg(test)]
mod test;
