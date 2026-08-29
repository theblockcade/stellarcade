//! Stellarcade Binary Prediction Market Contract (experimental)
//!
//! Constant-product automated market maker for YES/NO outcome shares.
//! Traders buy and sell against a collateral-backed pool; after a
//! designated oracle resolves the market, winning shares redeem 1:1 for
//! collateral and losing shares expire.

#![no_std]
#![allow(unexpected_cfgs)]

mod math;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, String};

pub use types::{Market, Position};

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidCollateral = 1,
    InvalidExpiry = 2,
    MarketNotFound = 3,
    MarketExpired = 4,
    MarketResolved = 5,
    MarketNotResolved = 6,
    SlippageExceeded = 7,
    InsufficientShares = 8,
    NotResolver = 9,
    InvalidAmount = 10,
    MathOverflow = 11,
    AlreadyResolved = 12,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    NextMarketId,
    Market(u64),
    Position(u64, Address),
}

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    /// Open a binary market seeded with `initial_collateral` of YES and NO
    /// reserves (50/50 start). `creator` is the designated resolver.
    pub fn create_market(
        env: Env,
        creator: Address,
        title: String,
        expiry_ts: u64,
        initial_collateral: u128,
    ) -> Result<u64, Error> {
        creator.require_auth();
        if initial_collateral == 0 {
            return Err(Error::InvalidCollateral);
        }
        if expiry_ts <= env.ledger().timestamp() {
            return Err(Error::InvalidExpiry);
        }

        let id = read_next_id(&env);
        write_next_id(&env, id + 1);
        write_market(
            &env,
            &Market {
                id,
                creator,
                title,
                expiry_ts,
                yes_pool: initial_collateral,
                no_pool: initial_collateral,
                collateral: initial_collateral,
                resolved: false,
                winning_is_yes: false,
            },
        );
        Ok(id)
    }

    /// Buy YES or NO shares against the CPMM. Returns shares received.
    pub fn buy_shares(
        env: Env,
        market_id: u64,
        trader: Address,
        outcome_is_yes: bool,
        investment_amount: u128,
        min_shares: u128,
    ) -> Result<u128, Error> {
        trader.require_auth();
        let mut market = require_tradable(&env, market_id)?;
        if investment_amount == 0 {
            return Err(Error::InvalidAmount);
        }

        let (new_yes, new_no, shares) =
            math::buy(market.yes_pool, market.no_pool, outcome_is_yes, investment_amount)
                .ok_or(Error::MathOverflow)?;
        if shares < min_shares {
            return Err(Error::SlippageExceeded);
        }

        market.yes_pool = new_yes;
        market.no_pool = new_no;
        market.collateral = market
            .collateral
            .checked_add(investment_amount)
            .ok_or(Error::MathOverflow)?;
        write_market(&env, &market);

        let mut pos = read_position(&env, market_id, &trader);
        if outcome_is_yes {
            pos.yes_shares = pos
                .yes_shares
                .checked_add(shares)
                .ok_or(Error::MathOverflow)?;
        } else {
            pos.no_shares = pos
                .no_shares
                .checked_add(shares)
                .ok_or(Error::MathOverflow)?;
        }
        write_position(&env, market_id, &trader, &pos);
        Ok(shares)
    }

    /// Sell YES or NO shares back to the CPMM. Returns collateral payout.
    pub fn sell_shares(
        env: Env,
        market_id: u64,
        trader: Address,
        outcome_is_yes: bool,
        shares_amount: u128,
        min_payout: u128,
    ) -> Result<u128, Error> {
        trader.require_auth();
        let mut market = require_tradable(&env, market_id)?;
        if shares_amount == 0 {
            return Err(Error::InvalidAmount);
        }

        let mut pos = read_position(&env, market_id, &trader);
        let held = if outcome_is_yes {
            pos.yes_shares
        } else {
            pos.no_shares
        };
        if shares_amount > held {
            return Err(Error::InsufficientShares);
        }

        let (new_yes, new_no, payout) =
            math::sell(market.yes_pool, market.no_pool, outcome_is_yes, shares_amount)
                .ok_or(Error::MathOverflow)?;
        if payout < min_payout {
            return Err(Error::SlippageExceeded);
        }

        market.yes_pool = new_yes;
        market.no_pool = new_no;
        market.collateral = market.collateral.saturating_sub(payout);
        write_market(&env, &market);

        if outcome_is_yes {
            pos.yes_shares -= shares_amount;
        } else {
            pos.no_shares -= shares_amount;
        }
        write_position(&env, market_id, &trader, &pos);
        Ok(payout)
    }

    /// Oracle resolution: `resolver` must be the market creator.
    pub fn resolve_market(
        env: Env,
        market_id: u64,
        winning_is_yes: bool,
        resolver: Address,
    ) -> Result<(), Error> {
        resolver.require_auth();
        let mut market = read_market(&env, market_id).ok_or(Error::MarketNotFound)?;
        if market.resolved {
            return Err(Error::AlreadyResolved);
        }
        if resolver != market.creator {
            return Err(Error::NotResolver);
        }
        market.resolved = true;
        market.winning_is_yes = winning_is_yes;
        write_market(&env, &market);
        Ok(())
    }

    /// Redeem winning shares 1:1 for collateral. Losing shares expire.
    pub fn redeem_winnings(env: Env, market_id: u64, trader: Address) -> Result<u128, Error> {
        trader.require_auth();
        let mut market = read_market(&env, market_id).ok_or(Error::MarketNotFound)?;
        if !market.resolved {
            return Err(Error::MarketNotResolved);
        }

        let mut pos = read_position(&env, market_id, &trader);
        let winning = if market.winning_is_yes {
            pos.yes_shares
        } else {
            pos.no_shares
        };
        pos.yes_shares = 0;
        pos.no_shares = 0;
        write_position(&env, market_id, &trader, &pos);

        market.collateral = market.collateral.saturating_sub(winning);
        write_market(&env, &market);
        Ok(winning)
    }

    /// Spot YES/NO prices in basis points (always sum to 10_000).
    pub fn get_market_prices(env: Env, market_id: u64) -> Result<(u32, u32), Error> {
        let market = read_market(&env, market_id).ok_or(Error::MarketNotFound)?;
        Ok(math::prices_bps(market.yes_pool, market.no_pool))
    }
}

fn require_tradable(env: &Env, market_id: u64) -> Result<Market, Error> {
    let market = read_market(env, market_id).ok_or(Error::MarketNotFound)?;
    if market.resolved {
        return Err(Error::MarketResolved);
    }
    if env.ledger().timestamp() >= market.expiry_ts {
        return Err(Error::MarketExpired);
    }
    Ok(market)
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

fn read_next_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextMarketId)
        .unwrap_or(0)
}

fn write_next_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextMarketId, &id);
}

fn read_market(env: &Env, id: u64) -> Option<Market> {
    env.storage().persistent().get(&DataKey::Market(id))
}

fn write_market(env: &Env, market: &Market) {
    let key = DataKey::Market(market.id);
    env.storage().persistent().set(&key, market);
    extend(env, &key);
}

fn read_position(env: &Env, market_id: u64, trader: &Address) -> Position {
    env.storage()
        .persistent()
        .get(&DataKey::Position(market_id, trader.clone()))
        .unwrap_or(Position {
            yes_shares: 0,
            no_shares: 0,
        })
}

fn write_position(env: &Env, market_id: u64, trader: &Address, pos: &Position) {
    let key = DataKey::Position(market_id, trader.clone());
    env.storage().persistent().set(&key, pos);
    extend(env, &key);
}
