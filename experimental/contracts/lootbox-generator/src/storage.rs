//! Storage keys and access helpers for the lootbox generator contract.

use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::{InventoryEntry, LootItem};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Table(u64),
    TableWeight(u64),
    Inventory(Address),
    Nonce(Address),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_table(env: &Env, table_id: u64) -> Option<Vec<LootItem>> {
    env.storage().persistent().get(&DataKey::Table(table_id))
}

pub fn write_table(env: &Env, table_id: u64, items: &Vec<LootItem>) {
    let key = DataKey::Table(table_id);
    env.storage().persistent().set(&key, items);
    extend(env, &key);
}

pub fn read_total_weight(env: &Env, table_id: u64) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::TableWeight(table_id))
        .unwrap_or(0)
}

pub fn write_total_weight(env: &Env, table_id: u64, weight: u64) {
    let key = DataKey::TableWeight(table_id);
    env.storage().persistent().set(&key, &weight);
    extend(env, &key);
}

pub fn read_inventory(env: &Env, player: &Address) -> Vec<InventoryEntry> {
    env.storage()
        .persistent()
        .get(&DataKey::Inventory(player.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn write_inventory(env: &Env, player: &Address, inv: &Vec<InventoryEntry>) {
    let key = DataKey::Inventory(player.clone());
    env.storage().persistent().set(&key, inv);
    extend(env, &key);
}

pub fn read_nonce(env: &Env, player: &Address) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::Nonce(player.clone()))
        .unwrap_or(0)
}

pub fn write_nonce(env: &Env, player: &Address, nonce: u64) {
    let key = DataKey::Nonce(player.clone());
    env.storage().persistent().set(&key, &nonce);
    extend(env, &key);
}
