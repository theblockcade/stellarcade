#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{ActiveLotSummary, BidWindowSnapshot};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
}

#[contract]
pub struct AuctionHouse;

#[contractimpl]
impl AuctionHouse {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Returns a summary of active lots in the auction house.
    pub fn active_lot_summary(env: Env) -> ActiveLotSummary {
        // For now, return empty state - this would be populated with actual lot data
        ActiveLotSummary {
            total_active_lots: 0,
            lots_in_bidding: 0,
            total_lot_value: 0,
        }
    }

    /// Returns a snapshot of the current bid window.
    pub fn bid_window_snapshot(env: Env) -> BidWindowSnapshot {
        // For now, return empty state - this would be populated with actual bid data
        BidWindowSnapshot {
            window_start: 0,
            window_end: 0,
            active_bids: 0,
            highest_bid: 0,
        }
    }
}

#[cfg(test)]
mod test;