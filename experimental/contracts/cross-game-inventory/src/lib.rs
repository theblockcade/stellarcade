#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, String, Vec};

pub use types::{InventoryItemSummary, ItemCategory, RegisteredItem};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    ItemAlreadyRegistered = 3,
    ItemNotFound = 4,
    InsufficientBalance = 5,
    NotSupportedGame = 6,
    NotAdmin = 7,
}

#[contract]
pub struct CrossGameInventory;

#[contractimpl]
impl CrossGameInventory {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if storage::read_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        storage::write_admin(&env, &admin);
        Ok(())
    }

    pub fn register_item(
        env: Env,
        admin: Address,
        item_id: String,
        category: ItemCategory,
        metadata_uri: String,
        supported_games: Vec<Address>,
    ) -> Result<(), Error> {
        let stored_admin = storage::read_admin(&env).ok_or(Error::NotInitialized)?;
        if admin != stored_admin {
            return Err(Error::NotAdmin);
        }
        admin.require_auth();

        if storage::read_item(&env, &item_id).is_some() {
            return Err(Error::ItemAlreadyRegistered);
        }

        storage::write_item(
            &env,
            &RegisteredItem {
                item_id: item_id.clone(),
                category,
                metadata_uri,
                supported_games,
            },
        );
        Ok(())
    }

    pub fn grant_item(
        env: Env,
        admin: Address,
        player: Address,
        item_id: String,
        quantity: u32,
    ) -> Result<(), Error> {
        let stored_admin = storage::read_admin(&env).ok_or(Error::NotInitialized)?;
        if admin != stored_admin {
            return Err(Error::NotAdmin);
        }
        admin.require_auth();

        if storage::read_item(&env, &item_id).is_none() {
            return Err(Error::ItemNotFound);
        }

        let current = storage::read_player_item_quantity(&env, &player, &item_id);
        let new_qty = current + quantity;
        storage::write_player_item_quantity(&env, &player, &item_id, new_qty);

        if current == 0 {
            let mut ids = storage::read_player_item_ids(&env, &player);
            ids.push_back(item_id);
            storage::write_player_item_ids(&env, &player, &ids);
        }

        Ok(())
    }

    pub fn consume_item(
        env: Env,
        game_contract: Address,
        player: Address,
        item_id: String,
    ) -> Result<bool, Error> {
        game_contract.require_auth();

        let item = storage::read_item(&env, &item_id).ok_or(Error::ItemNotFound)?;

        if !item.supported_games.contains(&game_contract) {
            return Err(Error::NotSupportedGame);
        }

        let qty = storage::read_player_item_quantity(&env, &player, &item_id);
        if qty == 0 {
            return Err(Error::InsufficientBalance);
        }

        storage::write_player_item_quantity(&env, &player, &item_id, qty - 1);
        Ok(true)
    }

    pub fn transfer_item(
        env: Env,
        from: Address,
        to: Address,
        item_id: String,
        quantity: u32,
    ) -> Result<(), Error> {
        from.require_auth();

        if storage::read_item(&env, &item_id).is_none() {
            return Err(Error::ItemNotFound);
        }

        let from_qty = storage::read_player_item_quantity(&env, &from, &item_id);
        if from_qty < quantity {
            return Err(Error::InsufficientBalance);
        }

        storage::write_player_item_quantity(&env, &from, &item_id, from_qty - quantity);

        let to_qty = storage::read_player_item_quantity(&env, &to, &item_id);
        storage::write_player_item_quantity(&env, &to, &item_id, to_qty + quantity);

        if to_qty == 0 {
            let mut ids = storage::read_player_item_ids(&env, &to);
            ids.push_back(item_id);
            storage::write_player_item_ids(&env, &to, &ids);
        }

        Ok(())
    }

    pub fn get_player_items(env: Env, player: Address) -> Vec<InventoryItemSummary> {
        let ids = storage::read_player_item_ids(&env, &player);
        let mut result = Vec::new(&env);
        for id in ids.iter() {
            let qty = storage::read_player_item_quantity(&env, &player, &id);
            if qty > 0 {
                result.push_back(InventoryItemSummary {
                    item_id: id,
                    quantity: qty,
                });
            }
        }
        result
    }
}
