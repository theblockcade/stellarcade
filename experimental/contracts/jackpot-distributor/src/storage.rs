//! Storage keys and access helpers for the jackpot distributor contract.

use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::TicketRange;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    TicketPrice,
    CarryoverBps,
    /// Active epoch number.
    Epoch,
    /// Ticket ranges sold in an epoch, in purchase order.
    Entries(u64),
    /// Tickets held by a player in an epoch.
    PlayerTickets(u64, Address),
    /// Total tickets sold in an epoch.
    TotalTickets(u64),
    /// Pool carried into an epoch from the previous draw.
    SeedValue(u64),
    /// Ticket revenue accumulated in an epoch.
    SalesValue(u64),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn read_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn read_ticket_price(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::TicketPrice).unwrap()
}

pub fn read_carryover_bps(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::CarryoverBps)
        .unwrap()
}

pub fn read_epoch(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::Epoch).unwrap_or(0)
}

pub fn write_epoch(env: &Env, epoch: u64) {
    env.storage().instance().set(&DataKey::Epoch, &epoch);
}

pub fn read_entries(env: &Env, epoch: u64) -> Vec<TicketRange> {
    env.storage()
        .persistent()
        .get(&DataKey::Entries(epoch))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn write_entries(env: &Env, epoch: u64, entries: &Vec<TicketRange>) {
    let key = DataKey::Entries(epoch);
    env.storage().persistent().set(&key, entries);
    extend(env, &key);
}

pub fn read_player_tickets(env: &Env, epoch: u64, player: &Address) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::PlayerTickets(epoch, player.clone()))
        .unwrap_or(0)
}

pub fn write_player_tickets(env: &Env, epoch: u64, player: &Address, count: u64) {
    let key = DataKey::PlayerTickets(epoch, player.clone());
    env.storage().persistent().set(&key, &count);
    extend(env, &key);
}

pub fn read_total_tickets(env: &Env, epoch: u64) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::TotalTickets(epoch))
        .unwrap_or(0)
}

pub fn write_total_tickets(env: &Env, epoch: u64, total: u64) {
    let key = DataKey::TotalTickets(epoch);
    env.storage().persistent().set(&key, &total);
    extend(env, &key);
}

pub fn read_seed_value(env: &Env, epoch: u64) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::SeedValue(epoch))
        .unwrap_or(0)
}

pub fn write_seed_value(env: &Env, epoch: u64, value: i128) {
    let key = DataKey::SeedValue(epoch);
    env.storage().persistent().set(&key, &value);
    extend(env, &key);
}

pub fn read_sales_value(env: &Env, epoch: u64) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::SalesValue(epoch))
        .unwrap_or(0)
}

pub fn write_sales_value(env: &Env, epoch: u64, value: i128) {
    let key = DataKey::SalesValue(epoch);
    env.storage().persistent().set(&key, &value);
    extend(env, &key);
}
