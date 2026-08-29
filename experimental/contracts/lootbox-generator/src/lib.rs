//! Stellarcade Lootbox Generator Contract (experimental)
//!
//! Configurable weighted drop tables (Common / Rare / Epic / Legendary).
//! Opening a box rolls a verifiable seed mixed with a per-player nonce
//! against the cumulative weight distribution and credits the item.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{
    contract, contracterror, contractimpl, symbol_short, Address, Bytes, BytesN, Env, Vec,
};

pub use types::{InventoryEntry, LootItem, LootResult, Rarity, TableProbability};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    EmptyTable = 1,
    InvalidWeight = 2,
    TableNotFound = 3,
    TableAlreadyExists = 4,
}

#[contract]
pub struct LootboxGenerator;

#[contractimpl]
impl LootboxGenerator {
    /// Register a drop table. `items` must be non-empty with strictly
    /// positive weights. Re-using a `table_id` is rejected.
    pub fn create_table(
        env: Env,
        admin: Address,
        table_id: u64,
        items: Vec<LootItem>,
    ) -> Result<(), Error> {
        admin.require_auth();
        if items.is_empty() {
            return Err(Error::EmptyTable);
        }
        if storage::read_table(&env, table_id).is_some() {
            return Err(Error::TableAlreadyExists);
        }

        let mut total: u64 = 0;
        for item in items.iter() {
            if item.weight == 0 {
                return Err(Error::InvalidWeight);
            }
            total = total
                .checked_add(item.weight as u64)
                .ok_or(Error::InvalidWeight)?;
        }
        if total == 0 {
            return Err(Error::EmptyTable);
        }

        storage::write_table(&env, table_id, &items);
        storage::write_total_weight(&env, table_id, total);
        Ok(())
    }

    /// Open a lootbox against `table_id` using `random_seed` and the
    /// player's nonce. Credits the rolled item to inventory.
    pub fn open_lootbox(
        env: Env,
        player: Address,
        table_id: u64,
        random_seed: BytesN<32>,
    ) -> Result<LootResult, Error> {
        player.require_auth();
        let items = storage::read_table(&env, table_id).ok_or(Error::TableNotFound)?;
        if items.is_empty() {
            return Err(Error::EmptyTable);
        }
        let total = storage::read_total_weight(&env, table_id);
        if total == 0 {
            return Err(Error::EmptyTable);
        }

        let nonce = storage::read_nonce(&env, &player);
        storage::write_nonce(&env, &player, nonce + 1);

        let roll = seed_roll(&env, &random_seed, nonce, total);
        let chosen = pick_by_weight(&items, roll);

        credit_item(&env, &player, chosen.item_id);

        let result = LootResult {
            player: player.clone(),
            table_id,
            item_id: chosen.item_id,
            rarity: chosen.rarity,
        };
        env.events().publish(
            (symbol_short!("lootdrop"), player, table_id, chosen.item_id),
            chosen.rarity,
        );
        Ok(result)
    }

    /// Per-item probabilities in basis points; always sums to 10_000.
    pub fn get_table_probabilities(
        env: Env,
        table_id: u64,
    ) -> Result<Vec<TableProbability>, Error> {
        let items = storage::read_table(&env, table_id).ok_or(Error::TableNotFound)?;
        let total = storage::read_total_weight(&env, table_id);
        if items.is_empty() || total == 0 {
            return Err(Error::EmptyTable);
        }

        let mut out = Vec::new(&env);
        let n = items.len();
        let mut remaining: u32 = 10_000;
        for i in 0..n {
            let item = items.get(i).unwrap();
            let bps = if i + 1 == n {
                remaining
            } else {
                let p = ((item.weight as u64) * 10_000 / total) as u32;
                remaining = remaining.saturating_sub(p);
                p
            };
            out.push_back(TableProbability {
                item_id: item.item_id,
                weight: item.weight,
                probability_bps: bps,
                rarity: item.rarity,
            });
        }
        Ok(out)
    }

    /// Items currently held by `player`.
    pub fn get_player_inventory(env: Env, player: Address) -> Vec<InventoryEntry> {
        storage::read_inventory(&env, &player)
    }
}

/// `u64::from_be_bytes(sha256(seed || nonce)[0..8]) % total`.
fn seed_roll(env: &Env, seed: &BytesN<32>, nonce: u64, total: u64) -> u64 {
    let mut preimage = Bytes::new(env);
    preimage.extend_from_array(&seed.to_array());
    preimage.extend_from_array(&nonce.to_be_bytes());
    let hash = env.crypto().sha256(&preimage).to_bytes().to_array();
    let mut val: u64 = 0;
    for b in &hash[0..8] {
        val = (val << 8) | *b as u64;
    }
    val % total
}

fn pick_by_weight(items: &Vec<LootItem>, roll: u64) -> LootItem {
    let mut cumulative: u64 = 0;
    for item in items.iter() {
        cumulative += item.weight as u64;
        if roll < cumulative {
            return item;
        }
    }
    items.get(items.len() - 1).unwrap()
}

fn credit_item(env: &Env, player: &Address, item_id: u64) {
    let mut inv = storage::read_inventory(env, player);
    for i in 0..inv.len() {
        let mut entry = inv.get(i).unwrap();
        if entry.item_id == item_id {
            entry.quantity += 1;
            inv.set(i, entry);
            storage::write_inventory(env, player, &inv);
            return;
        }
    }
    inv.push_back(InventoryEntry {
        item_id,
        quantity: 1,
    });
    storage::write_inventory(env, player, &inv);
}
