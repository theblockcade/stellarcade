//! Stellarcade Jackpot Distributor Contract (experimental)
//!
//! Progressive community jackpot: players buy tickets whose price is
//! escrowed into the epoch pool; each purchase is recorded as a contiguous,
//! non-overlapping ticket range. An admin-triggered draw derives the winning
//! ticket index from a supplied randomness seed, locates the holder via
//! binary search over the ranges, pays out the pool minus the configured
//! carryover percentage, and rolls the carryover into the next epoch's seed.
//!
//! ## Randomness
//! The winning index is `u64::from_be_bytes(seed[0..8]) % total_tickets`.
//! The seed is supplied by the admin (e.g. from an off-chain VRF or beacon)
//! and is fully auditable on-chain: anyone can recompute the index from the
//! seed and the published ticket ranges.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, BytesN, Env, Vec};

pub use types::{DrawResult, EpochSummary, TicketRange};

/// Upper bound on the carryover percentage (50%).
pub const MAX_CARRYOVER_BPS: u32 = 5_000;
/// Upper bound on tickets per purchase, to keep entry vectors bounded.
pub const MAX_TICKETS_PER_PURCHASE: u64 = 10_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidTicketPrice = 3,
    InvalidCarryover = 4,
    InvalidTicketCount = 5,
    NoTicketsSold = 6,
    MathOverflow = 7,
}

#[contract]
pub struct JackpotDistributor;

#[contractimpl]
impl JackpotDistributor {
    /// One-time setup: draw admin, pool token, ticket price, and the share
    /// of each pool kept as the next epoch's seed (in basis points).
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        ticket_price: i128,
        carryover_bps: u32,
    ) -> Result<(), Error> {
        if storage::read_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        if ticket_price <= 0 {
            return Err(Error::InvalidTicketPrice);
        }
        if carryover_bps > MAX_CARRYOVER_BPS {
            return Err(Error::InvalidCarryover);
        }
        env.storage()
            .instance()
            .set(&storage::DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&storage::DataKey::Token, &token);
        env.storage()
            .instance()
            .set(&storage::DataKey::TicketPrice, &ticket_price);
        env.storage()
            .instance()
            .set(&storage::DataKey::CarryoverBps, &carryover_bps);
        storage::write_epoch(&env, 0);
        Ok(())
    }

    /// Buy `ticket_count` tickets in the active epoch.
    ///
    /// Returns the purchased inclusive ticket index range `(start, end)`.
    pub fn buy_tickets(env: Env, player: Address, ticket_count: u64) -> Result<(u64, u64), Error> {
        player.require_auth();
        if storage::read_admin(&env).is_none() {
            return Err(Error::NotInitialized);
        }
        if ticket_count == 0 || ticket_count > MAX_TICKETS_PER_PURCHASE {
            return Err(Error::InvalidTicketCount);
        }

        let cost = storage::read_ticket_price(&env)
            .checked_mul(ticket_count as i128)
            .ok_or(Error::MathOverflow)?;
        token::Client::new(&env, &storage::read_token(&env)).transfer(
            &player,
            env.current_contract_address(),
            &cost,
        );

        let epoch = storage::read_epoch(&env);
        let total = storage::read_total_tickets(&env, epoch);
        let start = total;
        let end = total.checked_add(ticket_count).ok_or(Error::MathOverflow)? - 1;

        let mut entries = storage::read_entries(&env, epoch);
        entries.push_back(TicketRange {
            player: player.clone(),
            start,
            end,
        });
        storage::write_entries(&env, epoch, &entries);
        storage::write_total_tickets(&env, epoch, end + 1);
        storage::write_player_tickets(
            &env,
            epoch,
            &player,
            storage::read_player_tickets(&env, epoch, &player) + ticket_count,
        );
        storage::write_sales_value(
            &env,
            epoch,
            storage::read_sales_value(&env, epoch)
                .checked_add(cost)
                .ok_or(Error::MathOverflow)?,
        );
        Ok((start, end))
    }

    /// Draw the active epoch's winner from `random_seed`, pay out the pool
    /// minus the carryover share, and open the next epoch seeded with the
    /// carryover.
    pub fn draw_winner(env: Env, random_seed: BytesN<32>) -> Result<DrawResult, Error> {
        let admin = storage::read_admin(&env).ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let epoch = storage::read_epoch(&env);
        let total = storage::read_total_tickets(&env, epoch);
        if total == 0 {
            return Err(Error::NoTicketsSold);
        }

        let winning_ticket = seed_to_index(&random_seed, total);
        let entries = storage::read_entries(&env, epoch);
        let winner = holder_of(&entries, winning_ticket);

        let pool = storage::read_seed_value(&env, epoch)
            .checked_add(storage::read_sales_value(&env, epoch))
            .ok_or(Error::MathOverflow)?;
        let carryover = pool
            .checked_mul(storage::read_carryover_bps(&env) as i128)
            .ok_or(Error::MathOverflow)?
            / 10_000;
        let payout = pool - carryover;

        if payout > 0 {
            token::Client::new(&env, &storage::read_token(&env)).transfer(
                &env.current_contract_address(),
                &winner,
                &payout,
            );
        }

        let next_epoch = epoch + 1;
        storage::write_epoch(&env, next_epoch);
        storage::write_seed_value(&env, next_epoch, carryover);

        Ok(DrawResult {
            epoch,
            winning_ticket,
            winner,
            payout,
            carryover,
        })
    }

    /// Snapshot of the active epoch.
    pub fn get_current_epoch_info(env: Env) -> Result<EpochSummary, Error> {
        if storage::read_admin(&env).is_none() {
            return Err(Error::NotInitialized);
        }
        let epoch = storage::read_epoch(&env);
        let seed_value = storage::read_seed_value(&env, epoch);
        let pool_value = seed_value
            .checked_add(storage::read_sales_value(&env, epoch))
            .ok_or(Error::MathOverflow)?;
        Ok(EpochSummary {
            epoch,
            total_tickets: storage::read_total_tickets(&env, epoch),
            pool_value,
            seed_value,
            ticket_price: storage::read_ticket_price(&env),
            carryover_bps: storage::read_carryover_bps(&env),
        })
    }

    /// Tickets held by `player` in the active epoch.
    pub fn get_player_ticket_count(env: Env, player: Address) -> u64 {
        storage::read_player_tickets(&env, storage::read_epoch(&env), &player)
    }

    /// Ticket accumulation accessor: all ranges sold in the active epoch,
    /// in purchase order (contiguous and non-overlapping by construction).
    pub fn get_ticket_ranges(env: Env) -> Vec<TicketRange> {
        storage::read_entries(&env, storage::read_epoch(&env))
    }
}

/// Map a 32-byte seed to a ticket index in `[0, total)`.
fn seed_to_index(seed: &BytesN<32>, total: u64) -> u64 {
    let bytes = seed.to_array();
    let mut val: u64 = 0;
    for b in &bytes[0..8] {
        val = (val << 8) | *b as u64;
    }
    val % total
}

/// Binary search the purchase-ordered ranges for the holder of `ticket`.
fn holder_of(entries: &Vec<TicketRange>, ticket: u64) -> Address {
    let mut lo: u32 = 0;
    let mut hi: u32 = entries.len() - 1;
    loop {
        let mid = lo + (hi - lo) / 2;
        let entry = entries.get(mid).unwrap();
        if ticket < entry.start {
            hi = mid - 1;
        } else if ticket > entry.end {
            lo = mid + 1;
        } else {
            return entry.player;
        }
    }
}
