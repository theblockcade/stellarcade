use soroban_sdk::{contracttype, Address, Env, String, Vec};

use crate::types::RegisteredItem;

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Item(String),
    PlayerItem(Address, String),
    PlayerItems(Address),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn write_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn read_item(env: &Env, item_id: &String) -> Option<RegisteredItem> {
    env.storage()
        .persistent()
        .get(&DataKey::Item(item_id.clone()))
}

pub fn write_item(env: &Env, item: &RegisteredItem) {
    let key = DataKey::Item(item.item_id.clone());
    env.storage().persistent().set(&key, item);
    extend(env, &key);
}

pub fn read_player_item_quantity(env: &Env, player: &Address, item_id: &String) -> u32 {
    env.storage()
        .persistent()
        .get(&DataKey::PlayerItem(player.clone(), item_id.clone()))
        .unwrap_or(0)
}

pub fn write_player_item_quantity(env: &Env, player: &Address, item_id: &String, qty: u32) {
    let key = DataKey::PlayerItem(player.clone(), item_id.clone());
    env.storage().persistent().set(&key, &qty);
    extend(env, &key);
}

pub fn read_player_item_ids(env: &Env, player: &Address) -> Vec<String> {
    env.storage()
        .persistent()
        .get(&DataKey::PlayerItems(player.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn write_player_item_ids(env: &Env, player: &Address, ids: &Vec<String>) {
    let key = DataKey::PlayerItems(player.clone());
    env.storage().persistent().set(&key, ids);
    extend(env, &key);
}
